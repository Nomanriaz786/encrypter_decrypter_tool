import { useState } from 'react'
import { Key, Plus, Trash2, Download, Upload, Eye, EyeOff } from 'lucide-react'
import { Navigation } from '../components'
import { useAuth } from '../contexts/AuthContext'

interface CryptoKey {
  id: string
  name: string
  algorithm: string
  keySize: string
  created: string
  status: 'active' | 'revoked'
}

export default function KeyManagement() {
  const [keys, setKeys] = useState<CryptoKey[]>([
    {
      id: '1',
      name: 'Primary AES Key',
      algorithm: 'AES',
      keySize: '256',
      created: '2024-01-15',
      status: 'active'
    },
    {
      id: '2',
      name: 'RSA Key Pair',
      algorithm: 'RSA',
      keySize: '2048',
      created: '2024-01-10',
      status: 'active'
    }
  ])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState<string | null>(null)

  const handleCreateKey = (keyData: Omit<CryptoKey, 'id' | 'created'>) => {
    const newKey: CryptoKey = {
      ...keyData,
      id: Date.now().toString(),
      created: new Date().toISOString().split('T')[0]
    }
    setKeys([...keys, newKey])
    setShowCreateModal(false)
  }

  const handleRevokeKey = (keyId: string) => {
    setKeys(keys.map(key => 
      key.id === keyId ? { ...key, status: 'revoked' as const } : key
    ))
  }

  const handleDeleteKey = (keyId: string) => {
    setKeys(keys.filter(key => key.id !== keyId))
  }

  const handleKeyFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          let keyData
          
          // Try to parse as JSON first
          try {
            keyData = JSON.parse(content)
          } catch {
            // If not JSON, treat as raw key data
            keyData = {
              name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
              algorithm: 'Unknown',
              keySize: 'Unknown',
              keyData: content
            }
          }
          
          const newKey: CryptoKey = {
            id: Date.now().toString(),
            name: keyData.name || file.name,
            algorithm: keyData.algorithm || 'Unknown',
            keySize: keyData.keySize || 'Unknown',
            created: new Date().toISOString().split('T')[0],
            status: 'active'
          }
          
          setKeys([...keys, newKey])
          alert('Key uploaded successfully!')
        } catch (error) {
          alert('Error reading key file. Please check the file format.')
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <Key className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">Key Management</h1>
                <p className="text-sm text-gray-600 mt-1">Generate, manage, and store cryptographic keys</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate New Key
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {keys.map((key) => (
                <li key={key.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Key className={`h-6 w-6 ${key.status === 'active' ? 'text-green-500' : 'text-red-500'}`} />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">{key.name}</p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            key.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {key.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {key.algorithm}-{key.keySize} • Created {key.created}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowKeyModal(key.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                        <Download className="h-4 w-4" />
                      </button>
                      {key.status === 'active' && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-yellow-600 hover:text-yellow-900 text-sm font-medium"
                        >
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Import Key Section */}
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import Key</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="key-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload a key file
                    </span>
                    <input 
                      id="key-upload" 
                      name="key-upload" 
                      type="file" 
                      className="sr-only"
                      accept=".pem,.der,.json,.key,.txt"
                      onChange={handleKeyFileUpload}
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    PEM, DER, or JSON format up to 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Key Modal */}
      {showCreateModal && (
        <CreateKeyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateKey}
        />
      )}

      {/* View Key Modal */}
      {showKeyModal && (
        <ViewKeyModal
          keyId={showKeyModal}
          onClose={() => setShowKeyModal(null)}
        />
      )}
    </div>
  )
}

function CreateKeyModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (key: Omit<CryptoKey, 'id' | 'created'>) => void
}) {
  const [algorithm, setAlgorithm] = useState('AES')
  const [keySize, setKeySize] = useState('256')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({
      name: name || `${algorithm}-${keySize} Key`,
      algorithm,
      keySize,
      status: 'active'
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Generate New Key</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Key Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional key name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="AES">AES</option>
              <option value="RSA">RSA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Key Size</label>
            <select
              value={keySize}
              onChange={(e) => setKeySize(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {algorithm === 'AES' ? (
                <>
                  <option value="128">128 bits</option>
                  <option value="192">192 bits</option>
                  <option value="256">256 bits</option>
                </>
              ) : (
                <>
                  <option value="1024">1024 bits</option>
                  <option value="2048">2048 bits</option>
                  <option value="4096">4096 bits</option>
                </>
              )}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Generate Key
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ViewKeyModal({ keyId, onClose }: {
  keyId: string
  onClose: () => void
}) {
  const [showKey, setShowKey] = useState(false)
  
  // Mock key data - in real app, fetch from API
  const keyData = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC..."

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">View Key</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Key Data</label>
            <div className="mt-1 relative">
              <textarea
                value={showKey ? keyData : '••••••••••••••••••••••••••••••••'}
                readOnly
                rows={6}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-xs"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}