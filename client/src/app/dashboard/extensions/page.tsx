'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useExtensions, useCreateExtension, useUpdateExtension, useDeleteExtension } from '@/hooks';
import { Extension } from '@/types';

export default function ExtensionsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingExtension, setEditingExtension] = useState<Extension | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { extensions, isLoading, error, mutate } = useExtensions({ search: searchTerm });
  const { createExtension, isCreating, error: createError } = useCreateExtension();
  const { updateExtension, isUpdating, error: updateError } = useUpdateExtension();
  const { deleteExtension, isDeleting, error: deleteError } = useDeleteExtension();

  const handleCreateExtension = async (extensionData: Partial<Extension>) => {
    const result = await createExtension(extensionData);
    if (result.success) {
      setIsCreateModalOpen(false);
      mutate();
    }
  };

  const handleUpdateExtension = async (extensionData: Partial<Extension>) => {
    if (!editingExtension) return;
    
    const result = await updateExtension(editingExtension.id, extensionData);
    if (result.success) {
      setEditingExtension(null);
      mutate();
    }
  };

  const handleDeleteExtension = async (extensionId: string) => {
    if (!confirm('Are you sure you want to delete this extension?')) return;
    
    const result = await deleteExtension(extensionId);
    if (result.success) {
      mutate();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'busy': return 'bg-red-100 text-red-800';
      case 'ringing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Extensions</h1>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Search extensions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Extension
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {extensions.map((extension: Extension) => (
                <li key={extension.id}>
                  <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-lg">📞</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            Extension {extension.number}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(extension.status)}`}>
                            {extension.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{extension.callerId}</p>
                        <p className="text-xs text-gray-400">{extension.type.toUpperCase()} • {extension.context}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingExtension(extension)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExtension(extension.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {extensions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No extensions found
              </div>
            )}
          </div>
        )}

        {/* Create Extension Modal */}
        {isCreateModalOpen && (
          <ExtensionModal
            title="Create Extension"
            extension={null}
            onSubmit={handleCreateExtension}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={isCreating}
            error={createError}
          />
        )}

        {/* Edit Extension Modal */}
        {editingExtension && (
          <ExtensionModal
            title="Edit Extension"
            extension={editingExtension}
            onSubmit={handleUpdateExtension}
            onCancel={() => setEditingExtension(null)}
            isLoading={isUpdating}
            error={updateError}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

interface ExtensionModalProps {
  title: string;
  extension: Extension | null;
  onSubmit: (extensionData: Partial<Extension>) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

function ExtensionModal({ title, extension, onSubmit, onCancel, isLoading, error }: ExtensionModalProps) {
  const [formData, setFormData] = useState({
    number: extension?.number || '',
    type: extension?.type || 'sip',
    context: extension?.context || 'default',
    callerId: extension?.callerId || '',
    userId: extension?.userId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            {title}
          </h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Extension Number</label>
              <input
                type="text"
                required
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="1001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Caller ID</label>
              <input
                type="text"
                required
                value={formData.callerId}
                onChange={(e) => setFormData({ ...formData, callerId: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sip">SIP</option>
                <option value="iax2">IAX2</option>
                <option value="dahdi">DAHDI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Context</label>
              <input
                type="text"
                required
                value={formData.context}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="default"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <input
                type="text"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional: Link to user"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}