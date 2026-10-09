// import React, { useState, useEffect, useCallback } from 'react';

// const ViewAppointments = ({ user }) => {
//   const [reports, setReports] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const fetchReportsWithAppointments = useCallback(async () => {
//     if (!user) return;
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`http://localhost:5001/api/reports/patient/${user._id}`, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!response.ok) {
//         throw new Error('Failed to fetch your reports.');
//       }
//       const data = await response.json();
//       // Filter to only show reports that have an appointment scheduled
//       const appointments = data.filter(report => report.appointmentDate);
//       setReports(appointments);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [user]);

//   useEffect(() => {
//     fetchReportsWithAppointments();
//   }, [fetchReportsWithAppointments]);

//   // This is the card for a single appointment, containing all the logic
//   const AppointmentCard = ({ report }) => {
//     const [message, setMessage] = useState('');
//     const [isMessaging, setIsMessaging] = useState(false);

//     const sendAutomatedMessage = async (report, content) => {
//         try {
//             const token = localStorage.getItem('token');
//             await fetch(`http://localhost:5001/api/messages/${report._id}`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//                 body: JSON.stringify({
//                     content: content,
//                     receiverId: report.doctorId,
//                     senderRole: 'patient'
//                 })
//             });
//         } catch (error) {
//             console.error("Failed to send automated message", error);
//         }
//     };

//     const handleAppointmentAction = async (reportId, status) => {
//       try {
//         const token = localStorage.getItem('token');
//         await fetch(`http://localhost:5001/api/reports/${reportId}/appointment`, {
//           method: 'PUT',
//           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//           body: JSON.stringify({ status })
//         });
        
//         if (status === 'Confirmed') {
//             await sendAutomatedMessage(report, `I have confirmed the appointment for ${new Date(report.appointmentDate).toLocaleString()}.`);
//         } else if (status === 'Declined') {
//             await sendAutomatedMessage(report, "I have declined the scheduled appointment. I will follow up with a message to reschedule.");
//         }
//         fetchReportsWithAppointments();
//       } catch (error) {
//         console.error("Failed to update appointment", error);
//         alert('There was an error updating the appointment.');
//       }
//     };

//     const handleSendMessage = async () => {
//         if (!message.trim()) return;
//         setIsMessaging(true);
//         try {
//           const token = localStorage.getItem('token');
//           await fetch(`http://localhost:5001/api/messages/${report._id}`, {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//               body: JSON.stringify({ content: message, receiverId: report.doctorId, senderRole: 'patient' })
//           });
//           setMessage('');
//           alert('Your message has been sent to the doctor.');
//         } catch (error) {
//             console.error("Failed to send message", error);
//             alert('Could not send your message. Please try again.');
//         } finally {
//             setIsMessaging(false);
//         }
//     };

//     return (
//       <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-green-500">
//         <h5 className="font-semibold text-gray-800">Follow-up with Dr. {report.doctorName}</h5>
//         <p className="text-sm text-gray-500">Regarding report from: {new Date(report.createdAt).toLocaleDateString()}</p>
        
//         <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
//             <div className="flex justify-between items-center">
//                 <div>
//                     <p className="text-green-800 font-semibold">{new Date(report.appointmentDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
//                 </div>
//                 {report.appointmentStatus === 'Scheduled' && (
//                     <div className="flex space-x-3">
//                         <button onClick={() => handleAppointmentAction(report._id, 'Confirmed')} className="bg-green-500 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-green-600">Accept</button>
//                         <button onClick={() => handleAppointmentAction(report._id, 'Declined')} className="bg-red-500 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-red-600">Decline</button>
//                     </div>
//                 )}
//             </div>
            
//             {report.appointmentStatus === 'Confirmed' && <p className="text-green-700 font-bold mt-2">Appointment Confirmed!</p>}
//             {report.appointmentStatus === 'Declined' && (
//                 <div>
//                     <p className="text-red-700 font-bold mt-2">You have declined this appointment.</p>
//                     <div className="mt-3">
//                         <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Request a new time or ask a question..." className="w-full p-2 border rounded-md text-sm shadow-sm focus:ring-blue-500"></textarea>
//                         <button onClick={handleSendMessage} disabled={isMessaging} className="bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded mt-2 hover:bg-blue-600 disabled:bg-blue-300">{isMessaging ? 'Sending...' : 'Send Message to Doctor'}</button>
//                     </div>
//                 </div>
//             )}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div>
//       <h3 className="text-2xl font-bold text-gray-800 mb-6">Scheduled Appointments</h3>
//       {loading && <p>Loading your appointments...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && (
//         <div className="space-y-6">
//           {reports.length > 0 ? (
//             reports.map(report => <AppointmentCard key={report._id} report={report} />)
//           ) : (
//             <p className="text-center text-gray-500 py-8">You have no follow-up appointments scheduled.</p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ViewAppointments;
