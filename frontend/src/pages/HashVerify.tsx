import { useState } from 'react'
import { Hash, CheckCircle, XCircle, Upload, Copy, Download, RefreshCw, AlertCircle } from 'lucide-react'
import { Navigation } from '../components'
import { cryptoAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function HashVerify() {
  const [activeTab, setActiveTab] = useState<'hash' | 'verify'>('hash')

  const tabs = [
    { id: 'hash' as const, label: 'Generate Hash', icon: Hash },
    { id: 'verify' as const, label: 'Verify Integrity', icon: CheckCircle },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center">
              <Hash className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Hash & Verify</h1>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Generate cryptographic hashes and verify file integrity
            </p>
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
            {activeTab === 'hash' && <GenerateHashTab />}
            {activeTab === 'verify' && <VerifyIntegrityTab />}
          </div>
        </div>
      </main>
    </div>
  )
}

function GenerateHashTab() {
  const [inputText, setInputText] = useState('')
  const [algorithm, setAlgorithm] = useState('sha256')
  const [hash, setHash] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerateHash = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to hash')
      return
    }

    setLoading(true)
    try {
      const response = await cryptoAPI.hash({
        text: inputText,
        algorithm
      })

      setHash(response.data.hash)
      toast.success('Hash generated successfully!')
    } catch (error: any) {
      console.error('Hash generation error:', error)
      toast.error(error.response?.data?.error || 'Failed to generate hash')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyHash = () => {
    if (!hash) return
    navigator.clipboard.writeText(hash)
    toast.success('Hash copied to clipboard!')
  }

  const handleDownloadHash = () => {
    if (!hash) return

    const hashData = {
      hash,
      algorithm,
      originalText: inputText,
      generatedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(hashData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `hash_${algorithm}_${Date.now()}.json`
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Hash data downloaded!')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setInputText(content)
      toast.success('File loaded successfully!')
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    setInputText('')
    setHash('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Hash</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="hash-algorithm" className="block text-sm font-medium text-gray-700 mb-1">
              Hash Algorithm
            </label>
            <select
              id="hash-algorithm"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="md5">MD5 (128-bit)</option>
              <option value="sha1">SHA-1 (160-bit)</option>
              <option value="sha256">SHA-256 (256-bit) - Recommended</option>
              <option value="sha512">SHA-512 (512-bit)</option>
            </select>
          </div>

          <div>
            <label htmlFor="hash-input-text" className="block text-sm font-medium text-gray-700 mb-1">
              Input Text or Data
            </label>
            <textarea
              id="hash-input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={10}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter text to generate hash..."
            />
            <p className="mt-1 text-xs text-gray-500">{inputText.length} characters</p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleGenerateHash}
              disabled={loading || !inputText.trim()}
              className="flex-1 flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Hash className="h-4 w-4 mr-2" />
                  Generate Hash
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </div>

        {/* File Upload Alternative */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Or Upload File</h4>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="file-upload-hash" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Upload file
                  </span>
                  <input
                    id="file-upload-hash"
                    type="file"
                    className="sr-only"
                    onChange={handleFileUpload}
                    accept=".txt,.json,.csv,.xml,.log"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Text files up to 10MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Hash</h3>

        <div className="space-y-4">
          {hash ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hash Value ({algorithm.toUpperCase()})
                </label>
                <div className="relative">
                  <textarea
                    value={hash}
                    readOnly
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-xs break-all"
                  />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Hash Generated Successfully</p>
                    <p className="text-xs text-green-700 mt-1">
                      Use this hash to verify data integrity later. Any change to the input will produce a completely different hash.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleCopyHash}
                  className="flex-1 flex items-center justify-center bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Hash
                </button>
                <button
                  onClick={handleDownloadHash}
                  className="flex-1 flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Hash Details</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Algorithm:</dt>
                    <dd className="text-gray-900 font-medium">{algorithm.toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Hash Length:</dt>
                    <dd className="text-gray-900">{hash.length} characters</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Input Length:</dt>
                    <dd className="text-gray-900">{inputText.length} characters</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Generated At:</dt>
                    <dd className="text-gray-900">{new Date().toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Hash className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Hash Generated</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter text and click "Generate Hash" to create a cryptographic hash
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VerifyIntegrityTab() {
  const [originalData, setOriginalData] = useState('')
  const [expectedHash, setExpectedHash] = useState('')
  const [algorithm, setAlgorithm] = useState('sha256')
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean
    actualHash: string
    expectedHash: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (!originalData.trim()) {
      toast.error('Please enter the original data')
      return
    }
    if (!expectedHash.trim()) {
      toast.error('Please enter the expected hash')
      return
    }

    setLoading(true)
    try {
      const response = await cryptoAPI.verifyIntegrity({
        actualData: originalData,
        expectedHash: expectedHash.trim(),
        algorithm
      })

      setVerificationResult({
        isValid: response.data.isValid,
        actualHash: response.data.actualHash,
        expectedHash: response.data.expectedHash
      })

      toast[response.data.isValid ? 'success' : 'error'](
        response.data.isValid
          ? '✓ Integrity verified - Data matches!'
          : '✗ Integrity check failed - Data has been modified!'
      )
    } catch (error: any) {
      console.error('Verification error:', error)
      toast.error(error.response?.data?.error || 'Failed to verify integrity')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setOriginalData(content)
      toast.success('File loaded successfully!')
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    setOriginalData('')
    setExpectedHash('')
    setVerificationResult(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Verify Data Integrity</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="verify-algorithm" className="block text-sm font-medium text-gray-700 mb-1">
              Hash Algorithm
            </label>
            <select
              id="verify-algorithm"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="md5">MD5</option>
              <option value="sha1">SHA-1</option>
              <option value="sha256">SHA-256</option>
              <option value="sha512">SHA-512</option>
            </select>
          </div>

          <div>
            <label htmlFor="verify-original-data" className="block text-sm font-medium text-gray-700 mb-1">
              Original Data
            </label>
            <textarea
              id="verify-original-data"
              value={originalData}
              onChange={(e) => setOriginalData(e.target.value)}
              rows={6}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the original data to verify..."
            />
            <p className="mt-1 text-xs text-gray-500">{originalData.length} characters</p>
          </div>

          <div>
            <label htmlFor="verify-expected-hash" className="block text-sm font-medium text-gray-700 mb-1">
              Expected Hash Value
            </label>
            <input
              id="verify-expected-hash"
              type="text"
              value={expectedHash}
              onChange={(e) => setExpectedHash(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Paste the expected hash here..."
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleVerify}
              disabled={loading || !originalData.trim() || !expectedHash.trim()}
              className="flex-1 flex items-center justify-center bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Integrity
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </div>

        {/* File Upload Alternative */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Or Upload File</h4>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="file-upload-verify" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Upload file to verify
                  </span>
                  <input
                    id="file-upload-verify"
                    type="file"
                    className="sr-only"
                    onChange={handleFileUpload}
                    accept=".txt,.json,.csv,.xml,.log"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Text files up to 10MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Result</h3>
        <VerificationResult
          verificationResult={verificationResult}
          algorithm={algorithm}
          originalData={originalData}
        />
      </div>
    </div>
  )
}

type VerificationResultProps = {
  verificationResult: {
    isValid: boolean
    actualHash: string
    expectedHash: string
  } | null
  algorithm: string
  originalData: string
}

function VerificationResult({ verificationResult, algorithm, originalData }: Readonly<VerificationResultProps>) {
  if (!verificationResult) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Verification Performed</h3>
        <p className="mt-1 text-sm text-gray-500">
          Enter data and expected hash to verify integrity
        </p>
      </div>
    )
  }

  const { isValid, actualHash, expectedHash } = verificationResult

  return (
    <div className="space-y-4">
      <div className={`p-6 rounded-lg border-2 ${
        isValid ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {isValid ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <div className="ml-4">
            <h3 className={`text-xl font-bold ${
              isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {isValid ? 'Integrity Verified ✓' : 'Integrity Check Failed ✗'}
            </h3>
            <p className={`mt-2 text-sm ${
              isValid ? 'text-green-700' : 'text-red-700'
            }`}>
              {isValid
                ? 'The data matches the expected hash. The content has not been modified.'
                : 'The data does not match the expected hash. The content may have been tampered with or corrupted.'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Hash Comparison</h4>
        
        <div className="space-y-3">
          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Expected Hash:</dt>
            <dd className="text-xs text-gray-900 font-mono bg-gray-50 p-2 rounded break-all">
              {expectedHash}
            </dd>
          </div>
          
          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Actual Hash:</dt>
            <dd className={`text-xs font-mono p-2 rounded break-all ${
              isValid ? 'text-green-900 bg-green-50' : 'text-red-900 bg-red-50'
            }`}>
              {actualHash}
            </dd>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                {isValid
                  ? 'Both hashes match exactly, confirming data integrity.'
                  : 'The hashes do not match. Even a single character change will produce a completely different hash.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Algorithm:</dt>
              <dd className="text-gray-900 font-medium">{algorithm.toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status:</dt>
              <dd className={`font-bold ${
                isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {isValid ? 'VALID' : 'INVALID'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Data Length:</dt>
              <dd className="text-gray-900">{originalData.length} chars</dd>
            </div>
            <div>
              <dt className="text-gray-500">Verified At:</dt>
              <dd className="text-gray-900">{new Date().toLocaleTimeString()}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
