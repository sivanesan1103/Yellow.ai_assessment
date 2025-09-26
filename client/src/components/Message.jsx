import React, { useEffect } from 'react'
import { assets } from '../assets/assets'
import moment from 'moment'
import Markdown from 'react-markdown'
import Prism from 'prismjs'

const Message = ({message}) => {

  useEffect(()=>{
    Prism.highlightAll()
  },[message.content])

  return (
    <div>
      {message.role === "user" ? (
        <div className='flex items-start justify-end my-4 gap-2'>
          <div className='flex flex-col gap-2 p-2 px-4 bg-slate-50 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md max-w-2xl'>
            {message.isFile && message.fileInfo && (
              <div className='flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md mb-2'>
                <span className='text-sm'>📎</span>
                <div className='flex-1'>
                  <p className='text-xs font-medium'>{message.fileInfo.name}</p>
                  <p className='text-xs text-gray-500'>{message.fileInfo.type} • {(message.fileInfo.size/1024/1024).toFixed(2)}MB</p>
                  {message.fileInfo.url && (
                    <a 
                      href={`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'}${message.fileInfo.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className='text-xs text-blue-500 hover:text-blue-700'
                    >
                      View File
                    </a>
                  )}
                </div>
              </div>
            )}
            <p className='text-sm dark:text-primary'>{message.content}</p>
            <span className='text-xs text-gray-400 dark:text-[#B1A6C0]'>
              {moment(message.timestamp).fromNow()}</span>
          </div>
          <img src={assets.user_icon} alt="" className='w-8 rounded-full'/>
        </div>
      )
      : 
      (
        <div className='inline-flex flex-col gap-2 p-2 px-4 max-w-2xl bg-primary/20 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md my-4'>
          {message.isImage ? (
            <img src={message.content} alt="" className='w-full max-w-md mt-2 rounded-md'/>
          ):
          (
            <div className='text-sm dark:text-primary reset-tw'>
             <Markdown>{message.content}</Markdown></div>
          )}
          <span className='text-xs text-gray-400 dark:text-[#B1A6C0]'>{moment(message.timestamp).fromNow()}</span>
        </div>
      )
    }
    </div>
  )
}

export default Message
