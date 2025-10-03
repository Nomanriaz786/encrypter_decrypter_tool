import { useState } from 'react'
import { Signature, FileText, CheckCircle, XCircle, Upload } from 'lucide-react'
import { Navigation } from '../components'

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

function SignDocumentTab() {
  const [document, setDocument] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [signature, setSignature] = useState('')
  const [algorithm, setAlgorithm] = useState('RSA-SHA256')

  const handleSign = () => {
    // TODO: Implement actual digital signature
    setSignature(`Digital signature generated using ${algorithm}`)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setDocument(content)
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
              <option value="ECDSA-SHA256">ECDSA with SHA-256</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Document Content</label>
            <textarea
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              rows={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter document content to sign"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Private Key</label>
            <textarea
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
              placeholder="-----BEGIN PRIVATE KEY-----"
            />
          </div>

          <button
            onClick={handleSign}
            disabled={!document || !privateKey}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Digital Signature
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Signature</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Digital Signature</label>
            <textarea
              value={signature}
              readOnly
              rows={8}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-xs"
              placeholder="Digital signature will appear here"
            />
          </div>

          {signature && (
            <div className="flex space-x-2">
              <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                Download Signature
              </button>
              <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
                Copy to Clipboard
              </button>
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