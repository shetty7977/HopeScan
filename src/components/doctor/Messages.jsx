import React, { useState, useEffect } from 'react';

// Simple loading spinner
const Spinner = ({ text = "Loading..."}) => (
    <div className="flex justify-center items-center h-full p-4">
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">{text}</span>
    </div>
);


const Messages = ({ user }) => {
    // State for threads, messages, loading etc.
    const [threads, setThreads] = useState([]);
    const [currentThread, setCurrentThread] = useState(null); // Stores the selected report object
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingThreads, setLoadingThreads] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState(''); // For displaying errors

    // Fetch message threads (conversations, likely grouped by report/patient)
    useEffect(() => {
        const fetchThreads = async () => {
            setLoadingThreads(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                // Assuming this route returns a list of reports associated with conversations
                const response = await fetch('http://localhost:5001/api/reports', { // Fetch reports to act as threads
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                 if (!response.ok) throw new Error('Failed to fetch reports for conversations.');
                const data = await response.json();
                // Filter reports that might logically have messages (e.g., reviewed or have appointments)
                // Or adjust based on how your backend organizes threads
                setThreads(data);
            } catch (error) {
                console.error("Failed to fetch message threads", error);
                setError('Could not load conversations.');
            } finally {
                setLoadingThreads(false);
            }
        };
        if (user?._id) { // Ensure user is loaded
             fetchThreads();
        }
    }, [user?._id]); // Depend on user ID

    // Fetch messages for the selected thread (report)
    const selectThread = async (report) => {
        setCurrentThread(report);
        setLoadingMessages(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            // Assuming this route fetches messages specifically linked to the report ID
            const response = await fetch(`http://localhost:5001/api/messages/${report._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
             if (!response.ok) throw new Error('Failed to fetch messages for this conversation.');
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
            setError('Could not load messages.');
        } finally {
            setLoadingMessages(false);
        }
    };

    // Send a new message from the doctor
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentThread) return;
        setError('');

        try {
            const token = localStorage.getItem('token');
            // Assuming this route posts a new message linked to the report ID
            const response = await fetch(`http://localhost:5001/api/messages/${currentThread._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: newMessage,
                    receiverId: currentThread.patientId, // Sending to the patient associated with the report
                    // senderId is implicitly the logged-in user (doctor) from the token
                })
            });
             if (!response.ok) throw new Error('Failed to send message.');
            const data = await response.json();
            // Assuming the backend returns the newly created message
            setMessages(prevMessages => [...prevMessages, data]); // Use functional update
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message", error);
            setError('Could not send message.');
        }
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-lg overflow-hidden border">
            {/* Thread List */}
            <div className="w-1/3 border-r flex flex-col">
                <h3 className="text-lg font-semibold p-4 border-b text-gray-800 flex-shrink-0">Conversations</h3>
                 {error && <p className="p-4 text-red-600">{error}</p>}
                <ul className="divide-y overflow-y-auto flex-grow">
                    {loadingThreads ? (
                        <Spinner text="Loading conversations..." />
                    ) : threads.length === 0 ? (
                         <p className="p-4 text-center text-gray-500">No conversations found.</p>
                    ): (
                        threads.map(report => (
                            <li key={report._id} onClick={() => selectThread(report)}
                                className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${currentThread?._id === report._id ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}>
                                <p className="font-semibold text-gray-900 truncate">Patient: {report.patientName}</p>
                                <p className="text-sm text-gray-500">Report from: {new Date(report.createdAt).toLocaleDateString()}</p>
                                {/* Optionally show a snippet of the last message */}
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Message View */}
            <div className="w-2/3 flex flex-col">
                {currentThread ? (
                    <>
                        {/* Header for the selected chat */}
                        <div className="p-4 border-b flex items-center flex-shrink-0">
                            <h3 className="font-semibold text-lg text-gray-800">Chat with {currentThread.patientName}</h3>
                            {/* Maybe add link to the report */}
                        </div>

                        {/* Message display area */}
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                            {loadingMessages ? (
                                <Spinner text="Loading messages..." />
                            ) : messages.length === 0 ? (
                                <p className="text-center text-gray-500">No messages in this conversation yet.</p>
                            ) : (
                                // --- UPDATED Message Rendering Logic ---
                                messages.map(msg => {
                                    // Determine if the message is from the currently logged-in doctor
                                    const isDoctorMessage = msg.senderId === user._id;

                                    return (
                                        <div key={msg._id} className={`flex ${isDoctorMessage ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow-sm ${
                                                isDoctorMessage
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-800' // Patient messages (including system messages sent *by* patient)
                                            }`}>
                                                <p className="text-sm">{msg.content}</p>
                                                {/* Optional: Add timestamp */}
                                                <p className={`text-xs mt-1 ${isDoctorMessage ? 'text-blue-100' : 'text-gray-500'} text-right`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                                // --- End of Updated Logic ---
                            )}
                        </div>

                        {/* Message input form */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t flex flex-shrink-0 bg-white">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loadingMessages} // Disable input while loading
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-6 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-blue-300"
                                disabled={!newMessage.trim() || loadingMessages} // Disable if no message or loading
                            >
                                Send
                            </button>
                        </form>
                    </>
                ) : (
                    // Placeholder when no thread is selected
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <p>Select a conversation to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
