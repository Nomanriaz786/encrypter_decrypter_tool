import { useState, useEffect } from 'react'
import { Signature, FileText, CheckCircle, XCircle, Upload, Download, Copy, RefreshCw } from 'lucide-react'
import { Navigation } from '../components'
import { signatureAPI, keyAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function DigitalSignature() {
  const [activeTab, setActiveTab] = useState('sign')

  const tabs = [
    { id: 'sign', label: 'Sign Document', icon: Signature },
    { id: 'verify', label: 'Verify Signature', icon: CheckCircle },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center">
              <Signature className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Digital Signatures</h1>
            </div>
            <p className="mt-2 text-sm text-gray-600">Create and verify digital signatures for document authentication</p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'sign' && <SignDocumentTab />}
            {activeTab === 'verify' && <VerifySignatureTab />}
          </div>
        </div>
      </main>
    </div>
  )
}

interface CryptoKey {
  id: string
  name: string
  algorithm: string
  keySize: number
  status: 'active' | 'revoked'
  keyData: string
  publicKey?: string
}

function SignDocumentTab() {
  const [documentText, setDocumentText] = useState('')
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [keys, setKeys] = useState<CryptoKey[]>([])
  const [signature, setSignature] = useState('')
  const [signaturePayload, setSignaturePayload] = useState<any>(null)
  const [algorithm, setAlgorithm] = useState('RSA-SHA256')
  const [loading, setLoading] = useState(false)
  const [loadingKeys, setLoadingKeys] = useState(true)

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    try {
      setLoadingKeys(true)
      const response = await keyAPI.getKeys()
      // Filter to only RSA keys since signatures require RSA
      const rsaKeys = (response.data.keys || []).filter((k: CryptoKey) => 
        k.algorithm === 'RSA' && k.status === 'active'
      )
      setKeys(rsaKeys)
    } catch (error: any) {
      console.error('Error loading keys:', error)
      toast.error('Failed to load keys')
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleSign = async () => {
    if (!documentText.trim()) {
      toast.error('Please enter document content')
      return
    }
    if (!selectedKey) {
      toast.error('Please select a signing key')
      return
    }

    setLoading(true)
    try {
      // Get the full key data
      const keyResponse = await keyAPI.getKey(selectedKey)
      const keyData = keyResponse.data.key

      // Sign the document
      const response = await signatureAPI.signDocument({
        document: documentText,
        privateKey: keyData.keyData,
        algorithm,
        metadata: {
          keyId: selectedKey,
          keyName: keyData.name
        }
      })

      setSignature(response.data.signature)
      setSignaturePayload(response.data.signaturePayload)
      toast.success('Document signed successfully!')
    } catch (error: any) {
      console.error('Signing error:', error)
      toast.error(error.response?.data?.error || 'Failed to sign document')
    } finally {
      setLoading(false)
    }
  }

  const handleCopySignature = () => {
    if (!signature) return
    
    const signatureData = JSON.stringify({
      signature,
      signaturePayload,
      algorithm
    }, null, 2)
    
    navigator.clipboard.writeText(signatureData)
    toast.success('Signature copied to clipboard!')
  }

  const handleDownloadSignature = () => {
    if (!signature) return

    const signatureData = {
      signature,
      signaturePayload,
      algorithm,
      document: documentText,
      signedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(signatureData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `signature_${Date.now()}.json`
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Signature downloaded!')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setDocumentText(content)
        toast.success('File loaded successfully!')
      }
      reader.onerror = () => {
        toast.error('Failed to read file')
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Document Signing</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Signature Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="RSA-SHA256">RSA with SHA-256</option>
              <option value="RSA-SHA512">RSA with SHA-512</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select RSA Signing Key</label>
            {loadingKeys ? (
              <div className="flex items-center justify-center py-4 text-gray-500">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading keys...
              </div>
            ) : keys.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                No RSA keys found. Please generate an RSA key in Key Management first.
              </div>
            ) : (
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a signing key...</option>
                {keys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name} (RSA-{key.keySize})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Document Content</label>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              rows={8}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the document content you want to sign..."
            />
            <p className="mt-1 text-xs text-gray-500">{documentText.length} characters</p>
          </div>

          <button
            onClick={handleSign}
            disabled={loading || !documentText.trim() || !selectedKey}
            className="w-full flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <Signature className="h-4 w-4 mr-2" />
                Generate Digital Signature
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Signature</h3>
        
        <div className="space-y-4">
          {signature ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Digital Signature</label>
                <textarea
                  value={JSON.stringify({
                    signature,
                    signaturePayload,
                    algorithm
                  }, null, 2)}
                  readOnly
                  rows={12}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-xs"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Signature Generated Successfully</p>
                    <p className="text-xs text-green-700 mt-1">
                      The document has been signed with your private key. Save this signature to verify the document later.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={handleDownloadSignature}
                  className="flex-1 flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Signature
                </button>
                <button 
                  onClick={handleCopySignature}
                  className="flex-1 flex items-center justify-center bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </button>
              </div>

              {signaturePayload && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Signature Details</h4>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Signer:</dt>
                      <dd className="text-gray-900">{signaturePayload.signer}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Algorithm:</dt>
                      <dd className="text-gray-900">{signaturePayload.algorithm}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Document Hash:</dt>
                      <dd className="text-gray-900 font-mono text-xs break-all">{signaturePayload.documentHash}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Timestamp:</dt>
                      <dd className="text-gray-900">{new Date(signaturePayload.timestamp).toLocaleString()}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Signature className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Signature Generated</h3>
              <p className="mt-1 text-sm text-gray-500">
                Sign a document to see the digital signature here
              </p>
            </div>
          )}
        </div>

        {/* File Upload Alternative */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Or Upload Document</h4>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="document-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Upload document
                  </span>
                  <input 
                    id="document-upload" 
                    name="document-upload" 
                    type="file" 
                    className="sr-only"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, TXT up to 10MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VerifySignatureTab() {
  const [document, setDocument] = useState('')
  const [signature, setSignature] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [verificationResult, setVerificationResult] = useState<'unknown' | 'valid' | 'invalid'>('unknown')

  const handleVerify = () => {
    // TODO: Implement actual signature verification
    // For demo purposes, randomly return valid/invalid
    setVerificationResult(Math.random() > 0.5 ? 'valid' : 'invalid')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Signature Verification</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Original Document</label>
            <textarea
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter original document content"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Digital Signature</label>
            <textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
              placeholder="Paste digital signature here"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Public Key</label>
            <textarea
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
              placeholder="-----BEGIN PUBLIC KEY-----"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={!document || !signature || !publicKey}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify Signature
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Result</h3>
        
        {verificationResult !== 'unknown' && (
          <div className={`p-4 rounded-md ${
            verificationResult === 'valid' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {verificationResult === 'valid' ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-lg font-medium ${
                  verificationResult === 'valid' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult === 'valid' ? 'Signature Valid' : 'Signature Invalid'}
                </h3>
                <div className={`mt-2 text-sm ${
                  verificationResult === 'valid' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {verificationResult === 'valid' 
                    ? 'The digital signature is authentic and the document has not been tampered with.'
                    : 'The digital signature verification failed. The document may have been modified or the signature is not authentic.'
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {verificationResult === 'unknown' && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No verification performed</h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter document, signature, and public key to verify authenticity
            </p>
          </div>
        )}

        {/* Signature Details */}
        {verificationResult !== 'unknown' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Signature Details</h4>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Algorithm:</dt>
                <dd className="text-gray-900">RSA-SHA256</dd>
              </div>
              <div>
                <dt className="text-gray-500">Key Size:</dt>
                <dd className="text-gray-900">2048 bits</dd>
              </div>
              <div>
                <dt className="text-gray-500">Verified At:</dt>
                <dd className="text-gray-900">{new Date().toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}