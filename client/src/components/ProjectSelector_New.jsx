import React, { useState, useEffect, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const ProjectSelector = ({ isMenuOpen, setIsMenuOpen }) => {
    const { projects, selectedProject, setSelectedProject, createNewProject, updateProject, showDeleteConfirmation, user, chats } = useAppContext()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProject, setEditingProject] = useState(null)
    const [projectForm, setProjectForm] = useState({ name: '', description: '' })

    const handleProjectSelect = (project) => {
        setSelectedProject(project)
        setIsMenuOpen(false)
    }

  
    const getProjectChatCount = (projectId) => {
        if (!chats || chats.length === 0) {
            return 0
        }
        const count = chats.filter(chat => 
            chat.projectId === projectId || 
            (chat.projectId && chat.projectId._id === projectId)
        ).length
        return count
    }



    const handleCreateProject = async (e) => {
        e.preventDefault()
        if (!projectForm.name.trim()) return
        
        const result = await createNewProject(projectForm)
        if (result) {
            setShowCreateModal(false)
            setProjectForm({ name: '', description: '' })
            setSelectedProject(result)
        }
    }

    const handleEditProject = async (e) => {
        e.preventDefault()
        if (!projectForm.name.trim()) return
        
        const result = await updateProject(editingProject._id, projectForm)
        if (result) {
            setShowEditModal(false)
            setEditingProject(null)
            setProjectForm({ name: '', description: '' })
        }
    }

    const handleDeleteProject = (project, e) => {
        e.stopPropagation()
        showDeleteConfirmation('project', project._id, project.name)
    }

    const startEditProject = (project, e) => {
        e.stopPropagation()
        setEditingProject(project)
        setProjectForm({
            name: project.name,
            description: project.description || ''
        })
        setShowEditModal(true)
    }

    return (
        <div className='mb-4'>
            {/* Project Selector */}
            <div className='flex items-center justify-between mb-3'>
                <h3 className='text-sm font-medium text-gray-600 dark:text-gray-300'>Projects</h3>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className='text-xs bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-white px-2 py-1 rounded hover:opacity-90'
                >
                    + New
                </button>
            </div>

            {/* Projects List */}
            <div className='space-y-2 max-h-32 overflow-y-auto'>
                {projects.map((project) => (
                    <div 
                        key={project._id}
                        onClick={() => handleProjectSelect(project)}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer group transition-all ${
                            selectedProject?._id === project._id 
                                ? 'bg-gradient-to-r from-[#A456F7]/20 to-[#3D81F6]/20 border border-[#80609F]/30' 
                                : 'hover:bg-gray-100 dark:hover:bg-[#57317C]/10 border border-transparent'
                        }`}
                    >
                        <div className='flex items-center gap-2 flex-1 min-w-0'>
                            <div className='min-w-0 flex-1'>
                                <p className='text-xs font-medium truncate'>{project.name}</p>
                                {project.isDefault && (
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>Default</p>
                                )}
                            </div>
                            <span className='text-xs text-gray-400'>{getProjectChatCount(project._id)}</span>
                        </div>
                        
                        <div className='hidden group-hover:flex gap-1'>
                            <button 
                                onClick={(e) => startEditProject(project, e)}
                                className='p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded'
                            >
                                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                                </svg>
                            </button>
                            {!project.isDefault && (
                                <button 
                                    onClick={(e) => handleDeleteProject(project, e)}
                                    className='p-1 hover:bg-red-200 dark:hover:bg-red-600 rounded text-red-500'
                                >
                                    <img src={assets.bin_icon} className='w-3 h-3' alt='Delete' />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                    <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90%]'>
                        <h3 className='text-lg font-semibold mb-4'>Create New Project</h3>
                        <form onSubmit={handleCreateProject}>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-2'>Project Name</label>
                                <input
                                    type='text'
                                    value={projectForm.name}
                                    onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                                    className='w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                                    placeholder='Enter project name'
                                    required
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-2'>Description (Optional)</label>
                                <textarea
                                    value={projectForm.description}
                                    onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                                    className='w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                                    placeholder='Project description'
                                    rows={3}
                                />
                            </div>
                            <div className='flex gap-2'>
                                <button
                                    type='button'
                                    onClick={() => setShowCreateModal(false)}
                                    className='flex-1 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='flex-1 px-4 py-2 bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-white rounded-md hover:opacity-90'
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {showEditModal && editingProject && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                    <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90%]'>
                        <h3 className='text-lg font-semibold mb-4'>Edit Project</h3>
                        <form onSubmit={handleEditProject}>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-2'>Project Name</label>
                                <input
                                    type='text'
                                    value={projectForm.name}
                                    onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                                    className='w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                                    placeholder='Enter project name'
                                    required
                                />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-2'>Description (Optional)</label>
                                <textarea
                                    value={projectForm.description}
                                    onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                                    className='w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                                    placeholder='Project description'
                                    rows={3}
                                />
                            </div>
                            <div className='flex gap-2'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowEditModal(false)
                                        setEditingProject(null)
                                    }}
                                    className='flex-1 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='flex-1 px-4 py-2 bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-white rounded-md hover:opacity-90'
                                >
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProjectSelector