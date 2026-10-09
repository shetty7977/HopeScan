# --- Part 1: Imports ---
import io
import cv2
import numpy as np
import base64
import torch
import torch.nn as nn
from flask import Flask, request, jsonify
from flask_cors import CORS # --- ADD THIS LINE ---
from torchvision import models, transforms
from PIL import Image
import torch.nn.functional as F # For softmax

# --- Part 2: Flask App Initialization ---
app = Flask(__name__)
CORS(app) # --- ADD THIS LINE --- Enable CORS for all routes

# --- Part 3: Model Loading ---
print("➡ Loading real model...")
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load the base model architecture
MODEL = models.densenet121()
num_features = MODEL.classifier.in_features

# Define the classifier exactly as in training
MODEL.classifier = nn.Sequential(
    nn.Dropout(p=0.5), # Assuming dropout was used in training
    nn.Linear(num_features, 2) # 2 classes: Benign, Malignant
)

# --- UPDATE THIS PATH ---
# Load the trained weights (assuming .pth file is in the same folder as app.py)
model_path = 'best_model_checkpoint.pth' # Make sure this matches your file name
try:
    # Ensure model is on CPU first if loading CPU weights onto GPU or vice-versa
    MODEL.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    MODEL.to(DEVICE) # Now move model to the correct device
    MODEL.eval()
    print(f"✅ Real Model ready on {DEVICE}")
except FileNotFoundError:
    print(f"🚨 ERROR: Model file not found at {model_path}. Make sure it's in the ml_model folder.")
    exit() # Stop the app if model can't load
except Exception as e:
    print(f"🚨 ERROR: Failed to load model weights: {e}")
    exit()

# --- Part 4: Preprocessing Pipeline ---
INFERENCE_TRANSFORMS = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=3), # Convert grayscale to 3 channels for DenseNet
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.485, 0.485], std=[0.229, 0.229, 0.229]) # Standard ImageNet normalization
])

# --- Part 5: Grad-CAM and Overlay Logic ---
# (Using the corrected GradCAM class from previous step)
class GradCAM:
    def __init__(self, model, target_layer): # Corrected __init__
        self.model = model.eval()
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self._register_hooks() # Register hooks during initialization

    def _register_hooks(self):
        # Ensure hooks are not registered multiple times if re-initialized
        if hasattr(self.target_layer, '_forward_hook_handle'):
            self.target_layer._forward_hook_handle.remove()
        if hasattr(self.target_layer, '_backward_hook_handle'):
            self.target_layer._backward_hook_handle.remove()

        self.target_layer._forward_hook_handle = self.target_layer.register_forward_hook(self._forward_hook)
        # Use register_full_backward_hook for modern PyTorch versions
        self.target_layer._backward_hook_handle = self.target_layer.register_full_backward_hook(self._backward_hook)
        print(f"✅ Hooks registered for layer: {self.target_layer.__class__.__name__}")


    # Use _backward_hook convention
    def _backward_hook(self, module, grad_input, grad_output):
        # grad_output is a tuple, gradients are typically the first element
        self.gradients = grad_output[0]
        # print(f"Gradient shape: {self.gradients.shape}") # Debug


    # Use _forward_hook convention
    def _forward_hook(self, module, input, output):
        self.activations = output
        # print(f"Activation shape: {self.activations.shape}") # Debug

    def generate_heatmap(self, input_tensor, class_idx=None):
        self.model.zero_grad()
        # Ensure model is in eval mode
        self.model.eval()
        # We need gradients, so enable grad calculation
        input_tensor.requires_grad_(True)

        output = self.model(input_tensor)

        if class_idx is None:
            class_idx = torch.argmax(output).item()

        # Target for backpropagation
        target = output[0][class_idx]

        # Perform backward pass
        target.backward(retain_graph=True) # retain_graph might be needed

        # Ensure gradients and activations were captured
        if self.gradients is None or self.activations is None:
            print("🚨 ERROR: Gradients or Activations were not captured. Check hook registration and backward pass.")
            return None

        # Global Average Pooling of gradients
        pooled_gradients = torch.mean(self.gradients, dim=[0, 2, 3]) # Pool across spatial dimensions

        # Get activations (remove batch dimension)
        activations = self.activations.squeeze(0)

        # Weight channel activations by corresponding gradient importance
        for i in range(activations.shape[0]): # Iterate through channels
            activations[i, :, :] *= pooled_gradients[i]

        # Average weighted activations across channels
        heatmap = torch.mean(activations, dim=0).cpu().detach().numpy()

        # Apply ReLU to keep only positive contributions
        heatmap = np.maximum(heatmap, 0)

        # Normalize the heatmap
        if np.max(heatmap) > 0: # Avoid division by zero
             heatmap /= np.max(heatmap)
        else:
             print("⚠️ WARN: Max heatmap value is 0. Check model output or gradients.")
             # Return a zero heatmap or handle as appropriate
             return np.zeros_like(heatmap)

        return heatmap

def overlay_heatmap(original_img_bytes, heatmap, alpha=0.5, colormap=cv2.COLORMAP_JET):
    try:
        original_img = cv2.imdecode(np.frombuffer(original_img_bytes, np.uint8), cv2.IMREAD_COLOR)
        if original_img is None:
            print("🚨 ERROR: Could not decode original image bytes.")
            return None

        heatmap_resized = cv2.resize(heatmap, (original_img.shape[1], original_img.shape[0]))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        heatmap_color = cv2.applyColorMap(heatmap_uint8, colormap)

        # Ensure alpha blending is correct
        superimposed_img = cv2.addWeighted(heatmap_color, alpha, original_img, 1 - alpha, 0)
        return superimposed_img
    except Exception as e:
        print(f"🚨 ERROR in overlay_heatmap: {e}")
        return None

# --- IMPORTANT: Initialize Grad-CAM after model is fully loaded ---
grad_cam_generator = None # Initialize as None
try:
    # Adjust this path based on inspecting print(MODEL) if needed
    # Target the last convolutional layer in the final dense block for DenseNet-121
    target_gradcam_layer = MODEL.features.denseblock4.denselayer16.conv2
    if target_gradcam_layer:
        grad_cam_generator = GradCAM(MODEL, target_gradcam_layer)
        print("✅ Grad-CAM generator initialized.")
    else:
         print("🚨 ERROR: Could not find target layer for Grad-CAM. Check model structure.")
except AttributeError:
    print("🚨 ERROR: Attribute error finding target layer for Grad-CAM.")
except Exception as e:
     print(f"🚨 ERROR initializing Grad-CAM: {e}")


# --- Part 6: The API Prediction Endpoint ---
@app.route('/predict', methods=['POST'])
def predict():
    # File handling - Check for 'image' key first
    if 'image' not in request.files:
        if 'file' not in request.files: # Fallback check
             return jsonify({'error': 'No image file part in request (expected key "image")'}), 400
        else:
             file = request.files['file'] # Use 'file' if 'image' not found
             print("⚠️ WARN: Received image with key 'file', expected 'image'.")
    else:
        file = request.files['image']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if file:
        try:
            img_bytes = file.read()
            # Try opening as PIL Image first for transforms
            image_pil = Image.open(io.BytesIO(img_bytes)).convert('L') # Convert to Grayscale
            image_tensor = INFERENCE_TRANSFORMS(image_pil).unsqueeze(0).to(DEVICE)

            # Get prediction
            output = None # Initialize
            with torch.no_grad():
                output = MODEL(image_tensor)
                probabilities = F.softmax(output, dim=1) # Calculate probabilities
                confidence_score, predicted_idx = torch.max(probabilities, 1)

            prediction_idx = predicted_idx.item()
            confidence = confidence_score.item() # Get the confidence value
            prediction_label = {0: 'Benign', 1: 'Malignant'}.get(prediction_idx, 'Unknown')

            # --- STANDARDIZE OUTPUT ---
            response_data = {
                'diagnosis': prediction_label,
                'confidence': f"{confidence:.4f}", # Increase precision for confidence
                'grad_cam': None # Initialize grad_cam as None
            }

            # Generate Grad-CAM only if Malignant and generator exists
            if prediction_idx == 1 and grad_cam_generator:
                 print("Generating Grad-CAM for Malignant prediction...")
                 # Pass the tensor used for prediction, requires_grad enabled
                 heatmap = grad_cam_generator.generate_heatmap(image_tensor.clone().detach().requires_grad_(True), class_idx=1)
                 if heatmap is not None:
                     overlay_image = overlay_heatmap(img_bytes, heatmap)
                     if overlay_image is not None:
                         is_success, buffer = cv2.imencode('.jpg', overlay_image)
                         if is_success:
                             heatmap_base64 = base64.b64encode(buffer).decode('utf-8')
                             # Use 'grad_cam' key
                             response_data['grad_cam'] = f"data:image/jpeg;base64,{heatmap_base64}"
                         else:
                             print("🚨 ERROR: Failed to encode Grad-CAM overlay image.")
                     else:
                          print("🚨 ERROR: Failed to create Grad-CAM overlay.")
                 else:
                     print("🚨 ERROR: Failed to generate Grad-CAM heatmap.")
            elif prediction_idx == 1 and not grad_cam_generator:
                 print("⚠️ WARN: Grad-CAM generator not available.")


            print(f"Prediction: {response_data['diagnosis']}, Confidence: {response_data['confidence']}")
            return jsonify(response_data)

        except Exception as e:
            print(f"🚨 ERROR during prediction: {e}")
            import traceback
            traceback.print_exc() # Print detailed traceback
            return jsonify({'error': 'Prediction failed', 'details': str(e)}), 500
    else:
        # This case should not be reached if filename check passed, but good practice
         return jsonify({'error': 'File processing failed'}), 400

# --- Part 7: Start the Server ---
if __name__ == "__main__": # Corrected __name__ check
    print("Starting Flask server for Real Model...")
    # Change port back to 8000 and disable debug for stability
    app.run(host='0.0.0.0', port=8000, debug=False)

