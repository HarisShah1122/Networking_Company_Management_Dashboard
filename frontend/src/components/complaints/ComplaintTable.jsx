import React from 'react';
import { COMPLAINT_STATUS, COMPLAINT_PRIORITY, STATUS_LABELS, PRIORITY_LABELS } from '../../constants/complaintConstants';

const ComplaintTable = ({ complaints, currentPage, pageSize, canManage, onEdit }) => {
  const paginatedComplaints = complaints.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status) => {
    const colorClass = {
      [COMPLAINT_STATUS.ON_HOLD]: 'bg-orange-600 text-white',
      [COMPLAINT_STATUS.IN_PROGRESS]: 'bg-blue-600 text-white',
      [COMPLAINT_STATUS.CLOSED]: 'bg-gray-600 text-white',
      [COMPLAINT_STATUS.OPEN]: 'bg-yellow-600 text-white'
    }[status] || 'bg-yellow-600 text-white';

    return (
      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${colorClass}`}>
        {STATUS_LABELS[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const colorClass = {
      [COMPLAINT_PRIORITY.URGENT]: 'bg-red-600 text-white',
      [COMPLAINT_PRIORITY.HIGH]: 'bg-orange-600 text-white',
      [COMPLAINT_PRIORITY.MEDIUM]: 'bg-yellow-600 text-white',
      [COMPLAINT_PRIORITY.LOW]: 'bg-gray-600 text-white'
    }[priority] || 'bg-gray-600 text-white';

    return (
      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${colorClass}`}>
        {PRIORITY_LABELS[priority] || priority}
      </span>
    );
  };

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WhatsApp</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {complaints.length === 0 ? (
          <tr>
            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
              No complaints found.
            </td>
          </tr>
        ) : (
          paginatedComplaints.map((complaint) => {
            if (!complaint?.id) return null;
            
            return (
              <tr key={complaint.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{complaint.name ?? '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{complaint.whatsapp_number ?? '-'}</td>
                <td className="px-6 py-4">{complaint.title ?? '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(complaint.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getPriorityBadge(complaint.priority)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canManage && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(complaint)}
                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
};

export default ComplaintTable;
