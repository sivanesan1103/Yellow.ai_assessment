import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import moment from 'moment'
import toast from 'react-hot-toast'
import ProjectSelector from './ProjectSelector_New'

const Sidebar = ({ isMenuOpen, setIsMenuOpen }) => {

    const {chats, setSelectedChat, selectedProject, theme, setTheme, user, navigate, createNewChat, showDeleteConfirmation, setToken, token} = useAppContext()
    const [search, setSearch] = useState('')
    const [isCreatingChat, setIsCreatingChat] = useState(false)

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        toast.success('Logged out successfully')
    }

    const handleDeleteClick = (chatId, chatName) => {
        showDeleteConfirmation('chat', chatId, chatName)
    }

  return (
    <div className={`flex flex-col h-screen min-w-72 p-5 dark:bg-gradient-to-b from-[#242124]/30 to-[#000000]/30 border-r border-[#80609F]/30 backdrop-blur-3xl transition-all duration-500 max-md:absolute left-0 z-1 ${!isMenuOpen && 'max-md:-translate-x-full'}`}>
      {/* Logo */}
      <img onClick={()=>navigate('/')} src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark} alt="" className='w-full max-w-48 cursor-pointer'/>

      {/* Project Selector */}
      <div className='mt-6'>
        <ProjectSelector isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      </div>

      {/* New Chat Button */}
      <button 
        onClick={async () => {
          if (!user) {
            toast.error('Please login to create a new chat')
            return
          }
          if (!selectedProject) {
            toast.error('Please select a project first')
            return
          }
          setIsCreatingChat(true)
          await createNewChat()
          setIsCreatingChat(false)
        }}
        disabled={isCreatingChat || !selectedProject}
        className='flex justify-center items-center w-full py-2 mt-4 text-white bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-sm rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <span className='mr-2 text-xl'>+</span> 
        {isCreatingChat ? 'Creating...' : 'New Chat'}
      </button>

      {/* Search Conversations */}
      <div className='flex items-center gap-2 p-3 mt-4 border border-gray-400 dark:border-white/20 rounded-md'>
        <img src={assets.search_icon} className='w-4 not-dark:invert' alt="" />
        <input onChange={(e)=>setSearch(e.target.value)} value={search} type="text" placeholder='Search conversations' className='text-xs placeholder:text-gray-400 outline-none'/>
      </div>

      {/* Recent Chats */}
      {chats.length > 0 && selectedProject && (
        <p className='mt-4 text-sm flex items-center gap-2'>
          <span>Recent Chats in</span>
          <span className='font-medium text-[#A456F7]'>
            {selectedProject.name}
          </span>
        </p>
      )}
      <div className='flex-1 overflow-y-scroll mt-3 text-sm space-y-3'>
        {
            chats
                .filter((chat) => {
                    // First filter by selected project
                    if (selectedProject) {
                        const belongsToProject = chat.projectId === selectedProject._id || 
                                               (chat.projectId && chat.projectId._id === selectedProject._id);
                        if (!belongsToProject) return false;
                    }
                    
                    // Then filter by search text
                    const searchText = search.toLowerCase();
                    if (searchText) {
                        const chatContent = chat.messages[0] ? chat.messages[0].content.toLowerCase() : chat.name.toLowerCase();
                        return chatContent.includes(searchText);
                    }
                    
                    return true;
                })
                .map((chat)=>(
                <div onClick={()=> {navigate('/'); setSelectedChat(chat); setIsMenuOpen(false)}}
                 key={chat._id} className='p-2 px-4 dark:bg-[#57317C]/10 border border-gray-300 dark:border-[#80609F]/15 rounded-md cursor-pointer flex justify-between group'>
                    <div>
                        <p className='truncate w-full'>
                            {chat.messages.length > 0 ? chat.messages[0].content.slice(0,32) : chat.name}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-[#B1A6C0]'>{moment(chat.updatedAt).fromNow()}</p>
                    </div>
                    <img src={assets.bin_icon} className='hidden group-hover:block w-4 cursor-pointer not-dark:invert' alt="" 
                    onClick={e=> {
                        e.stopPropagation()
                        const chatName = chat.messages.length > 0 ? chat.messages[0].content.slice(0,32) : chat.name
                        handleDeleteClick(chat._id, chatName)
                    }} />
                </div>
            ))
        }
        
        {/* Show message when no chats in selected project */}
        {selectedProject && chats.filter((chat) => {
            const belongsToProject = chat.projectId === selectedProject._id || 
                                   (chat.projectId && chat.projectId._id === selectedProject._id);
            return belongsToProject && (!search || 
                (chat.messages[0] ? chat.messages[0].content.toLowerCase().includes(search.toLowerCase()) : 
                 chat.name.toLowerCase().includes(search.toLowerCase())));
        }).length === 0 && (
            <div className='flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400'>
                <p className='text-sm text-center'>
                    {search ? `No chats found matching "${search}"` : `No chats in "${selectedProject.name}" yet`}
                </p>
                {!search && (
                    <p className='text-xs mt-2 text-center'>
                        Click "New Chat" to start your first conversation
                    </p>
                )}
            </div>
        )}
        
        {/* Show message when no project is selected */}
        {!selectedProject && (
            <div className='flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400'>
                <p className='text-sm text-center'>
                    Please select a project to view chats
                </p>
                <p className='text-xs mt-2 text-center'>
                    Create a new project or select an existing one above
                </p>
            </div>
        )}
      </div>

 



    {/* Dark Mode Toggle  */}
    <div className='flex items-center justify-between gap-2 p-3 mt-4 border border-gray-300 dark:border-white/15 rounded-md'>
        <div className='flex items-center gap-2 text-sm'>
            <img src={assets.theme_icon} className='w-4 not-dark:invert' alt="" />
            <p>Dark Mode</p>
        </div>
        <label className='relative inline-flex cursor-pointer'>
            <input onChange={()=> setTheme(theme === 'dark' ? 'light' : 'dark')} type="checkbox" className="sr-only peer" checked={theme === 'dark'}/>
            <div className='w-9 h-5 bg-gray-400 rounded-full peer-checked:bg-purple-600 transition-all'>
            </div>
            <span className='absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4'></span>
        </label>
    </div>

    {/* User Account */}
    <div className='flex items-center gap-3 p-3 mt-4 border border-gray-300 dark:border-white/15 rounded-md cursor-pointer group'>
        <img src={assets.user_icon} className='w-7 rounded-full' alt="" />
        <p className='flex-1 text-sm dark:text-primary truncate'>{user ? user.name : 'Login your account'}</p>
        {user && <img onClick={logout} src={assets.logout_icon} className='h-5 cursor-pointer hidden not-dark:invert group-hover:block'/>}
    </div>

    <img onClick={()=> setIsMenuOpen(false)} src={assets.close_icon} className='absolute top-3 right-3 w-5 h-5 cursor-pointer md:hidden not-dark:invert' alt="" />

    </div>
  )
}

export default Sidebar
