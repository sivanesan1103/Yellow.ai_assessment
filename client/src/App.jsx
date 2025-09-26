import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import { Route, Routes, useLocation } from 'react-router-dom'
import ChatBox from './components/ChatBox'
import { assets } from './assets/assets'
import './assets/prism.css'
import Loading from './pages/Loading'
import { useAppContext } from './context/AppContext'
import Login from './pages/Login'
import {Toaster} from 'react-hot-toast'

const App = () => {

  const {user, loadingUser, showDeleteModal, itemToDelete, cancelDelete, confirmDelete} = useAppContext()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const {pathname} = useLocation()

  if(pathname === '/loading' || loadingUser) return <Loading />

  return (
    <>
    <Toaster />
    {!isMenuOpen && <img src={assets.menu_icon} className='absolute top-3 left-3 w-8 h-8 cursor-pointer md:hidden not-dark:invert' onClick={()=>setIsMenuOpen(true)}/>}

    {user ? (
      <div className='dark:bg-gradient-to-b from-[#242124] to-[#000000] dark:text-white'>
        <div className='flex h-screen w-screen'>
          <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}/>
          <Routes>
            <Route path='/' element={<ChatBox />} />
          </Routes>
        </div>
      </div>
    ) : (
      <div className='bg-gradient-to-b from-[#242124] to-[#000000] flex items-center justify-center h-screen w-screen'>
        <Login />
      </div>
    )}

    {/* Delete Confirmation Modal */}
    {showDeleteModal && (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center'>
              <svg className='w-6 h-6 text-red-600 dark:text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'></path>
              </svg>
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Delete {itemToDelete?.type === 'project' ? 'Project' : 'Chat'}
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>This action cannot be undone</p>
            </div>
          </div>
          
          <div className='mb-6'>
            <p className='text-gray-700 dark:text-gray-300'>
              {itemToDelete?.type === 'project' ? 
                'Are you sure you want to delete this project? All chats, messages, and uploaded files in this project will be permanently removed.' :
                'Are you sure you want to delete this chat? All messages and uploaded files will be permanently removed.'
              }
            </p>
            <div className='mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                {itemToDelete?.type === 'project' ? 'Project' : 'Chat'}: {itemToDelete?.name}
              </p>
            </div>
          </div>
          
          <div className='flex gap-3 justify-end'>
            <button 
              onClick={cancelDelete}
              className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded-md transition-colors'
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className='px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors'
            >
              Delete {itemToDelete?.type === 'project' ? 'Project' : 'Chat'}
            </button>
          </div>
        </div>
      </div>
    )}
      
    </>
  )
}

export default App
