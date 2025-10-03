import { useState, useEffect } from 'react'
import { Navigation } from '../components'
import { keyAPI, cryptoAPI } from '../services/api'
import { Lock, Unlock, Key, Upload, Download, AlertCircle, CheckCircle, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

interface CryptoKey {
  id: string
  name: string
  algorithm: string
  keySize: number
  status: 'active' | 'revoked'
}

export default function EncryptDecrypt() {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [keys, setKeys] = useState<CryptoKey[]>([])
  const [loading, setLoading] = useState(false)
  const [algorithm, setAlgorithm] = useState<'AES' | 'RSA'>('AES')

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    try {
      const response = await keyAPI.getKeys()
      const activeKeys = (response.data.keys || []).filter((key: CryptoKey) => key.status === 'active')
      setKeys(activeKeys)
      if (activeKeys.length > 0) {
        setSelectedKey(activeKeys[0].id)
        setAlgorithm(activeKeys[0].algorithm as 'AES' | 'RSA')
      }
    } catch (error) {
      console.error('Error loading keys:', error)
      toast.error('Failed to load encryption keys')
    }
  }

  const handleKeyChange = (keyId: string) => {
    setSelectedKey(keyId)
    const key = keys.find(k => k.id === keyId)
    if (key) {
      setAlgorithm(key.algorithm as 'AES' | 'RSA')
    }
  }

  const handleEncrypt = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to encrypt')
      return
    }
    if (!selectedKey) {
      toast.error('Please select an encryption key')
      return
    }

    setLoading(true)
    try {
      const selectedKeyObj = keys.find(k => k.id === selectedKey)
      if (!selectedKeyObj) {
        toast.error('Selected key not found')
        return
      }

      // Get the full key data from backend
      const keyResponse = await keyAPI.getKey(selectedKey)
      const keyData = keyResponse.data.key

      // Prepare encryption request
      const encryptData: any = {
        text: inputText,
        algorithm: selectedKeyObj.algorithm,
        keySize: selectedKeyObj.keySize
      }

      if (selectedKeyObj.algorithm === 'AES') {
        encryptData.key = keyData.keyData
      } else if (selectedKeyObj.algorithm === 'RSA') {
        encryptData.publicKey = keyData.publicKey
      }

      const response = await cryptoAPI.encrypt(encryptData)
      
      // Handle the response based on algorithm
      let encryptedText = ''
      if (selectedKeyObj.algorithm === 'AES') {
        // AES returns an object with encrypted data, iv, and authTag
        const result = response.data.result
        encryptedText = JSON.stringify({
          encrypted: result.encrypted,
          iv: result.iv,
          authTag: result.authTag,
          algorithm: result.algorithm
        }, null, 2)
      } else if (selectedKeyObj.algorithm === 'RSA') {
        // RSA returns encrypted string directly
        encryptedText = response.data.result.encrypted
      }

      setOutputText(encryptedText)
      toast.success('Text encrypted successfully')
    } catch (error: any) {
      console.error('Encryption error:', error)
      toast.error(error.response?.data?.error || 'Failed to encrypt text')
    } finally {
      setLoading(false)
    }
  }

  const handleDecrypt = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to decrypt')
      return
    }
    if (!selectedKey) {
      toast.error('Please select a decryption key')
      return
    }

    setLoading(true)
    try {
      const selectedKeyObj = keys.find(k => k.id === selectedKey)
      if (!selectedKeyObj) {
        toast.error('Selected key not found')
        return
      }

      // Get the full key data from backend
      const keyResponse = await keyAPI.getKey(selectedKey)
      const keyData = keyResponse.data.key

      // Prepare decryption request
      const decryptData: any = {
        algorithm: selectedKeyObj.algorithm,
        keySize: selectedKeyObj.keySize
      }

      if (selectedKeyObj.algorithm === 'AES') {
        // Parse the AES encrypted data JSON
        try {
          const encryptedObj = JSON.parse(inputText)
          decryptData.encryptedData = encryptedObj
          decryptData.key = keyData.keyData
        } catch (e) {
          console.error('AES decryption input parse error:', e);
          toast.error('Invalid AES encrypted data format. Expected JSON with encrypted, iv, and authTag fields.');
          setLoading(false);
          return;
        }
      } else if (selectedKeyObj.algorithm === 'RSA') {
        decryptData.encryptedData = inputText
        decryptData.privateKey = keyData.keyData
      }

      const response = await cryptoAPI.decrypt(decryptData)
      setOutputText(response.data.decrypted)
      toast.success('Text decrypted successfully')
    } catch (error: any) {
      console.error('Decryption error:', error)
      toast.error(error.response?.data?.error || 'Failed to decrypt text. Invalid format or key.')
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = () => {
    if (mode === 'encrypt') {
      handleEncrypt()
    } else {
      handleDecrypt()
    }
  }

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(outputText)
    toast.success('Copied to clipboard')
  }

  const handleClearAll = () => {
    setInputText('')
    setOutputText('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setInputText(text)
      toast.success('File loaded successfully')
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
    }
    reader.readAsText(file)
  }

  const handleDownloadOutput = () => {
    if (!outputText) {
      toast.error('No output to download')
      return
    }

    const blob = new Blob([outputText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mode}ed_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('File downloaded successfully')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex items-center mb-8">
            <Lock className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <h1 className="text-2xl font-bold text-gray-900">Encrypt & Decrypt</h1>
              <p className="text-sm text-gray-600 mt-1">
                Secure your data with advanced encryption algorithms
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setMode('encrypt')}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                    mode === 'encrypt'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Lock className="h-5 w-5 mr-2" />
                  Encrypt
                </button>
                <button
                  onClick={() => setMode('decrypt')}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                    mode === 'decrypt'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Unlock className="h-5 w-5 mr-2" />
                  Decrypt
                </button>
              </div>

              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Clear All
              </button>
            </div>

            {/* Key Selection */}
            <div className="mb-6">
              <label htmlFor="encryption-key-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Encryption Key
              </label>
              {keys.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">No active keys found</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Please create an encryption key in Key Management first
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <select
                    id="encryption-key-select"
                    value={selectedKey}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    className="flex-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {keys.map((key) => (
                      <option key={key.id} value={key.id}>
                        {key.name} ({key.algorithm}-{key.keySize})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center px-4 py-2 bg-gray-100 rounded-md">
                    <Key className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">{algorithm}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="input-text" className="block text-sm font-medium text-gray-700">
                  {mode === 'encrypt' ? 'Plain Text' : 'Encrypted Text'}
                </label>
                <label htmlFor="file-upload" className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Upload className="h-4 w-4 inline mr-1" />
                  Upload File
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  mode === 'encrypt'
                    ? 'Enter text to encrypt...'
                    : 'Enter encrypted text to decrypt...'
                }
                rows={8}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{inputText.length} characters</span>
                <span>Max 10MB for file uploads</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleProcess}
              disabled={loading || !selectedKey || !inputText.trim()}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {mode === 'encrypt' ? (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Encrypt Text
                    </>
                  ) : (
                    <>
                      <Unlock className="h-5 w-5 mr-2" />
                      Decrypt Text
                    </>
                  )}
                </>
              )}
            </button>

            {/* Output Section */}
            {outputText && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="output-text" className="block text-sm font-medium text-gray-700">
                    {mode === 'encrypt' ? 'Encrypted Text' : 'Decrypted Text'}
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyOutput}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Copy className="h-4 w-4 inline mr-1" />
                      Copy
                    </button>
                    <button
                      onClick={handleDownloadOutput}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Download className="h-4 w-4 inline mr-1" />
                      Download
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    id="output-text"
                    value={outputText}
                    readOnly
                    rows={8}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono text-sm"
                  />
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {outputText.length} characters
                </div>
                
                {/* AES Format Info */}
                {mode === 'encrypt' && outputText && selectedKey && (
                  (() => {
                    const selectedKeyObj = keys.find(k => k.id === selectedKey)
                    return selectedKeyObj?.algorithm === 'AES' && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">AES Encrypted Output Format</p>
                            <p className="text-xs mb-2">
                              The encrypted output is a JSON object containing:
                            </p>
                            <ul className="text-xs space-y-1 ml-4">
                              <li><strong>encrypted:</strong> The encrypted data in hexadecimal format</li>
                              <li><strong>iv:</strong> Initialization Vector (required for decryption)</li>
                              <li><strong>authTag:</strong> Authentication tag for GCM mode (ensures data integrity)</li>
                              <li><strong>algorithm:</strong> The encryption algorithm used</li>
                            </ul>
                            <p className="text-xs mt-2 text-blue-700">
                              💡 Copy this entire JSON output to decrypt the data later. All fields are required for decryption.
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                )}
              </div>
            )}
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                About Encryption
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <strong>AES:</strong> Fast symmetric encryption, ideal for large data
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <strong>RSA:</strong> Asymmetric encryption, uses public/private key pairs
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Encrypted data is secure and requires the correct key to decrypt</span>
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Security Tips
              </h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Never share your private keys with anyone</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Store encrypted backups in secure locations</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use strong, unique keys for different purposes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
