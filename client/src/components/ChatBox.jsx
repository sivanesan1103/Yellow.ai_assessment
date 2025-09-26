import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import Message from './Message'
import toast from 'react-hot-toast'

const ChatBox = () => {

  const containerRef = useRef(null)

  const { selectedChat, setSelectedChat, setChats, theme, user, axios, token } = useAppContext()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  
  // Constants for API calls - could be made configurable later
  const mode = selectedFile ? 'file' : 'text'
  const isPublished = false

  const onSubmit = async (e) => {
    try {
      e.preventDefault()
      if (!user) return toast('Login to send message')
      if (!selectedChat || !selectedChat._id) return toast('Please select a chat first')
      setLoading(true)
      const promptCopy = prompt
      const fileCopy = selectedFile
      setPrompt('')
      setSelectedFile(null)
      
      // Create user message
      const userMessage = {
        role: 'user', 
        content: selectedFile ? `${prompt || 'File uploaded: ' + selectedFile.name}` : prompt, 
        timestamp: Date.now(), 
        isImage: false,
        isFile: !!selectedFile,
        fileInfo: selectedFile ? {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type
        } : undefined
      }
      
      setMessages(prev => [...prev, userMessage])

      let data;
      if (selectedFile) {
        // Handle file upload
        const formData = new FormData()
        formData.append('file', fileCopy)
        formData.append('chatId', selectedChat._id)
        formData.append('prompt', prompt || '')
        
        const response = await axios.post(`/api/message/file`, formData, { 
          headers: { 
            Authorization: token,
            'Content-Type': 'multipart/form-data'
          } 
        })
        data = response.data
      } else {
        // Handle text message
        const response = await axios.post(`/api/message/text`, { chatId: selectedChat._id, prompt, isPublished }, { headers: { Authorization: token } })
        data = response.data
      }

      if (data.success) {
        setMessages(prev => [...prev, data.reply])
        
        // Update the selected chat with new messages, name, and timestamp
        const newMessages = [...messages, userMessage, data.reply]
        const updatedChat = {
          ...selectedChat,
          messages: newMessages,
          name: selectedChat.name === "New Chat" && newMessages.length > 0 ? 
                (fileCopy ? fileCopy.name : (prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt)) : 
                selectedChat.name,
          updatedAt: new Date().toISOString()
        }
        setSelectedChat(updatedChat)
        
        // Update the chat in the chats array
        setChats(prev => prev.map(chat => 
          chat._id === selectedChat._id ? updatedChat : chat
        ))

      } else {
        toast.error(data.message)
        setPrompt(promptCopy)
        setSelectedFile(fileCopy)
      }
    } catch (error) {
      toast.error(error.message)
      setPrompt(promptCopy)
      setSelectedFile(fileCopy)
    } finally {
      setPrompt('')
      setSelectedFile(null)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages)
    }
  }, [selectedChat])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      
      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'text/plain', 'text/csv',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('File type not supported. Supported: images, text files, PDF, Word documents')
        return
      }
      
      setSelectedFile(file)
      toast.success(`File selected: ${file.name}`)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    // Reset file input
    const fileInput = document.getElementById('file-upload')
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className='flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-30 max-md:mt-14 2xl:pr-40'>

      {/* Chat Messages */}
      <div ref={containerRef} className='flex-1 mb-5 overflow-y-scroll'>
        {messages.length === 0 && (
          <div className='h-full flex flex-col items-center justify-center gap-2 text-primary'>
            <img src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark} alt="" className='w-full max-w-56 sm:max-w-68' />
            <p className='mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white'>Ask me anything.</p>
          </div>
        )}

        {messages.map((message, index) => <Message key={index} message={message} />)}

        {/* Three Dots Loading  */}
        {
          loading && <div className='loader flex  items-center gap-1.5'>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'></div>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'></div>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'></div>
          </div>
        }
      </div>



      {/* File Preview */}
      {selectedFile && (
        <div className='w-full max-w-2xl mx-auto mb-3 p-3 bg-primary/10 dark:bg-[#583C79]/20 border border-primary/30 dark:border-[#80609F]/30 rounded-lg flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-600 dark:text-gray-300'>📎</span>
            <span className='text-sm text-gray-700 dark:text-gray-200'>{selectedFile.name}</span>
            <span className='text-xs text-gray-500'>({(selectedFile.size/1024/1024).toFixed(2)}MB)</span>
          </div>
          <button 
            type="button"
            onClick={removeFile}
            className='text-red-500 hover:text-red-700 text-sm'
          >
            ✕
          </button>
        </div>
      )}

      {/* Prompt Input Box */}
      <form onSubmit={onSubmit} className='bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center'>
        <input
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
          type="text"
          placeholder={selectedFile ? "Add a message about this file..." : "Type your prompt here..."}
          className='flex-1 w-full text-sm outline-none bg-transparent'
          required={!selectedFile}
        />

        {/* Hidden file input */}
        <input
          id="file-upload"
          type="file"
          onChange={handleFileSelect}
          className='hidden'
          accept="image/*,.txt,.csv,.pdf,.doc,.docx"
        />

        {/* File upload button */}
        <label 
          htmlFor="file-upload"
          className='flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary/10 dark:hover:bg-[#80609F]/20 transition-colors cursor-pointer'
        >
          <span className='text-lg'>📎</span>
        </label>

        <button disabled={loading} type="submit" className='flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary/10 dark:hover:bg-[#80609F]/20 transition-colors disabled:opacity-50'>
          <img src={loading ? assets.stop_icon : assets.send_icon} className='w-6 cursor-pointer' alt="" />
        </button>
      </form>
    </div>
  )
}

export default ChatBox
