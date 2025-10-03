import { useState, useEffect } from 'react'
import { Key, Plus, Trash2, Download, Upload, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react'
import { Navigation } from '../components'
import { keyAPI } from '../services/api'
import toast from 'react-hot-toast'

interface CryptoKey {
  id: string
  name: string
  algorithm: string
  keySize: number
  createdAt: string
  status: 'active' | 'revoked'
  publicKey?: string
}

export default function KeyManagement() {
  const [keys, setKeys] = useState<CryptoKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState<string | null>(null)

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    try {
      setLoading(true)
      const response = await keyAPI.getKeys()
      setKeys(response.data.keys || [])
    } catch (error: any) {
      console.error('Error loading keys:', error)
      toast.error(error.response?.data?.error || 'Failed to load keys')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async (keyData: { name: string; algorithm: string; keySize: number }) => {
    try {
      await keyAPI.generateKey({
        name: keyData.name,
        algorithm: keyData.algorithm,
        keySize: keyData.keySize
      })
      toast.success('Key generated successfully!')
      setShowCreateModal(false)
      await loadKeys() // Reload keys list
    } catch (error: any) {
      console.error('Error creating key:', error)
      toast.error(error.response?.data?.error || 'Failed to generate key')
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this key? This action cannot be undone.')) {
      return
    }
    
    try {
      await keyAPI.revokeKey(keyId)
      toast.success('Key revoked successfully')
      await loadKeys()
    } catch (error: any) {
      console.error('Error revoking key:', error)
      toast.error(error.response?.data?.error || 'Failed to revoke key')
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this key? This action cannot be undone.')) {
      return
    }
    
    try {
      await keyAPI.deleteKey(keyId)
      toast.success('Key deleted successfully')
      await loadKeys()
    } catch (error: any) {
      console.error('Error deleting key:', error)
      toast.error(error.response?.data?.error || 'Failed to delete key')
    }
  }

  const handleExportKey = async (keyId: string) => {
    try {
      const response = await keyAPI.exportKey(keyId)
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${response.data.name || 'key'}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Key exported successfully')
    } catch (error: any) {
      console.error('Error exporting key:', error)
      toast.error(error.response?.data?.error || 'Failed to export key')
    }
  }

  const handleKeyFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        let keyData
        
        // Try to parse as JSON first
        try {
          keyData = JSON.parse(content)
        } catch {
          toast.error('Invalid key file format. Please upload a valid JSON key file.')
          return
        }
        
        // Validate required fields
        if (!keyData.name || !keyData.algorithm || !keyData.keySize || !keyData.keyData) {
          toast.error('Key file is missing required fields (name, algorithm, keySize, keyData)')
          return
        }

        // Import the key
        await keyAPI.saveKey({
          name: keyData.name,
          algorithm: keyData.algorithm,
          keySize: Number(keyData.keySize),
          keyData: keyData.keyData,
          publicKey: keyData.publicKey || undefined
        })
        
        toast.success('Key imported successfully!')
        await loadKeys()
        
        // Reset file input
        event.target.value = ''
      } catch (error: any) {
        console.error('Error importing key:', error)
        toast.error(error.response?.data?.error || 'Failed to import key')
      }
    }
    reader.readAsText(file)
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

          {loading ? (
            <div className="bg-white shadow sm:rounded-md p-12">
              <div className="flex flex-col items-center justify-center text-gray-500">
                <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-lg font-medium">Loading keys...</p>
              </div>
            </div>
          ) : keys.length === 0 ? (
            <div className="bg-white shadow sm:rounded-md p-12">
              <div className="text-center">
                <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Keys Found</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Get started by generating your first cryptographic key
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Your First Key
                </button>
              </div>
            </div>
          ) : (
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
                          {key.algorithm}-{key.keySize} • Created {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowKeyModal(key.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        title="View Key"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleExportKey(key.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        title="Export Key"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {key.status === 'active' && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-yellow-600 hover:text-yellow-900 text-sm font-medium px-2 py-1 rounded hover:bg-yellow-50"
                          title="Revoke Key"
                        >
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          )}

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
  onCreate: (key: { name: string; algorithm: string; keySize: number }) => void
}) {
  const [algorithm, setAlgorithm] = useState('AES')
  const [keySize, setKeySize] = useState('256')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({
      name: name || `${algorithm}-${keySize} Key`,
      algorithm,
      keySize: Number(keySize)
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
  const [keyData, setKeyData] = useState<string>('')
  const [keyDetails, setKeyDetails] = useState<CryptoKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchKey = async () => {
      try {
        setLoading(true)
        const response = await keyAPI.getKey(keyId)
        const key = response.data.key
        setKeyDetails(key)
        setKeyData(key.keyData || '')
        setError(null)
      } catch (err: any) {
        console.error('Error fetching key:', err)
        setError(err.response?.data?.message || 'Failed to load key')
        toast.error('Failed to load key details')
      } finally {
        setLoading(false)
      }
    }
    fetchKey()
  }, [keyId])

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(keyData)
    toast.success('Key copied to clipboard')
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">View Key Details</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {keyDetails && (
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Name: </span>
                  <span className="text-sm text-gray-900">{keyDetails.name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Algorithm: </span>
                  <span className="text-sm text-gray-900">{keyDetails.algorithm}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Key Size: </span>
                  <span className="text-sm text-gray-900">{keyDetails.keySize} bits</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Status: </span>
                  <span className={`text-sm font-medium ${keyDetails.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {keyDetails.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Created: </span>
                  <span className="text-sm text-gray-900">{new Date(keyDetails.createdAt).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Private Key Data</label>
              <div className="relative">
                <textarea
                  value={showKey ? keyData : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                  readOnly
                  rows={8}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-xs resize-none"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {keyDetails?.publicKey && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Public Key</label>
                <textarea
                  value={keyDetails.publicKey}
                  readOnly
                  rows={6}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-xs resize-none"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 mt-4 border-t">
          <button
            onClick={handleCopyToClipboard}
            disabled={loading || !!error}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            Copy to Clipboard
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}