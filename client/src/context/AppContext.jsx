import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import toast from "react-hot-toast";
import authService from '../utils/authService';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
axios.defaults.withCredentials = true; // Enable cookies for OAuth


const AppContext = createContext()

export const AppContextProvider = ({ children })=>{

    const navigate = useNavigate()
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [token, setToken] = useState(localStorage.getItem('token') || null)
    
    // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [itemToDelete, setItemToDelete] = useState(null) // {type: 'chat'|'project', id, name}
    const [loadingUser, setLoadingUser] = useState(true)

    const fetchUser = async () => {
        try {
            // Try the new auth endpoint first
            const result = await authService.getCurrentUser();
            
            if (result.success) {
                setUser(result.user);
                return;
            }

            // Fallback to legacy endpoint for backward compatibility
            if (token) {
                const { data } = await axios.get('/api/user/data', {headers: {Authorization: token}});
                if (data.success) {
                    setUser(data.user);
                } else {
                    toast.error(data.message);
                }
            } else {
                // No token available
                setUser(null);
            }
        } catch (error) {
            console.error('Fetch user error:', error);
            // Don't show toast for authentication errors during initial load
            if (!error.response || error.response.status !== 401) {
                toast.error(error.message || 'Failed to fetch user data');
            }
            setUser(null);
        } finally {
            setLoadingUser(false);
        }
    }

    const createNewChat = async (projectId = null) => {
        try {
            if(!user) return toast('Login to create a new chat')
            navigate('/')
            
            const targetProjectId = projectId || selectedProject?._id
            const payload = targetProjectId ? { projectId: targetProjectId } : {}
            
            const { data } = await axios.post('/api/chat/create', payload, {headers: {Authorization: token}})
            if (data.success) {
                setSelectedChat(data.chat)
                // Fetch fresh data which will include the new chat
                await fetchUsersChats()
                toast.success('New chat created')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const fetchProjects = async () => {
        try {
            const { data } = await axios.get('/api/project', { headers: { Authorization: token } })
            if (data.success) {
                setProjects(data.projects)
                // Set default project as selected if no project is selected
                if (!selectedProject && data.projects.length > 0) {
                    const defaultProject = data.projects.find(p => p.isDefault) || data.projects[0]
                    setSelectedProject(defaultProject)
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const createNewProject = async (projectData) => {
        try {
            const { data } = await axios.post('/api/project', projectData, { headers: { Authorization: token } })
            if (data.success) {
                // Add the new project immediately
                setProjects(prev => [...prev, data.project])
                // Then fetch fresh data
                await fetchProjects()
                toast.success('Project created successfully')
                return data.project
            } else {
                toast.error(data.message)
                return null
            }
        } catch (error) {
            toast.error(error.message)
            return null
        }
    }

    const updateProject = async (projectId, updates) => {
        try {
            const { data } = await axios.put(`/api/project/${projectId}`, updates, { headers: { Authorization: token } })
            if (data.success) {
                // Update the project immediately in the local state
                setProjects(prev => prev.map(project => 
                    project._id === projectId ? { ...project, ...updates } : project
                ))
                await fetchProjects()
                toast.success('Project updated successfully')
                return data.project
            } else {
                toast.error(data.message)
                return null
            }
        } catch (error) {
            toast.error(error.message)
            return null
        }
    }

    const deleteProject = async (projectId) => {
        try {
            const { data } = await axios.delete(`/api/project/${projectId}`, { headers: { Authorization: token } })
            if (data.success) {
                // Remove the project immediately from local state
                setProjects(prev => prev.filter(project => project._id !== projectId))
                // If deleted project was selected, switch to default
                if (selectedProject?._id === projectId) {
                    setSelectedProject(null)
                    setChats([])
                    setSelectedChat(null)
                }
                await fetchProjects()
                toast.success('Project deleted successfully')
                return true
            } else {
                toast.error(data.message)
                return false
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
            return false
        } finally {
            setShowDeleteModal(false)
            setItemToDelete(null)
        }
    }

    // Delete confirmation modal functions
    const showDeleteConfirmation = (type, id, name) => {
        setItemToDelete({ type, id, name })
        setShowDeleteModal(true)
    }

    const cancelDelete = () => {
        setShowDeleteModal(false)
        setItemToDelete(null)
    }

    const confirmDelete = async () => {
        if (!itemToDelete) return false

        if (itemToDelete.type === 'chat') {
            return await deleteChat(itemToDelete.id)
        } else if (itemToDelete.type === 'project') {
            return await deleteProject(itemToDelete.id)
        }
        return false
    }

    const deleteChat = async (chatId) => {
        try {
            const { data } = await axios.post('/api/chat/delete', {chatId}, { headers: { Authorization: token } })
            if(data.success){
                setChats(prev => prev.filter(chat => chat._id !== chatId))
                await fetchUsersChats()
                toast.success(data.message)
                return true
            } else {
                toast.error(data.message)
                return false
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
            return false
        } finally {
            setShowDeleteModal(false)
            setItemToDelete(null)
        }
    }


    const fetchUsersChats = async (projectId = null) => {
       try {
        // Always fetch ALL chats for proper counting
        const {data} = await axios.get('/api/chat/get', { headers: { Authorization: token}})
        if(data.success){
            setChats(data.chats)
            
            // Filter chats for the selected project for display
            const targetProjectId = projectId || selectedProject?._id
            const filteredChats = targetProjectId ? 
                data.chats.filter(chat => 
                    chat.projectId === targetProjectId || 
                    (chat.projectId && chat.projectId._id === targetProjectId)
                ) : data.chats
            
            // Select the most recent chat from filtered chats
            if(filteredChats.length > 0 && targetProjectId){
                setSelectedChat(filteredChats[0])
            } else if (!targetProjectId && data.chats.length > 0) {
                setSelectedChat(data.chats[0])
            } else {
                setSelectedChat(null)
            }
        }else{
            toast.error(data.message)
        }
       } catch (error) {
            toast.error(error.message)
       }
    }

    useEffect(()=>{
        if(theme === 'dark'){
           document.documentElement.classList.add('dark');
        }else{
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme)
    },[theme])


    useEffect(()=>{
        if(user){
            fetchProjects()
        }
        else{
            setProjects([])
            setSelectedProject(null)
            setChats([])
            setSelectedChat(null)
        }
    },[user])

    useEffect(()=>{
        if(user){
            fetchUsersChats() // This now fetches all chats
        }
        else{
            setChats([])
            setSelectedChat(null)
        }
    },[selectedProject, user])

    useEffect(()=>{
        if(token){
            fetchUser()
        }else{
            setUser(null)
            setLoadingUser(false)
        }
        
    },[token])

    // Enhanced Authentication Methods
    const loginWithGoogle = () => {
        authService.loginWithGoogle();
    };

    const enhancedLogin = async (email, password) => {
        setLoadingUser(true);
        try {
            const result = await authService.login(email, password);
            if (result.success) {
                setUser(result.user);
                if (result.token) {
                    setToken(result.token);
                }
                toast.success('Login successful!');
                navigate('/');
                return result;
            } else {
                toast.error(result.message);
                return result;
            }
        } catch (error) {
            const message = error.message || 'Login failed';
            toast.error(message);
            return { success: false, message };
        } finally {
            setLoadingUser(false);
        }
    };

    const enhancedRegister = async (name, email, password) => {
        setLoadingUser(true);
        try {
            const result = await authService.register(name, email, password);
            if (result.success) {
                setUser(result.user);
                if (result.token) {
                    setToken(result.token);
                }
                toast.success('Registration successful!');
                navigate('/');
                return result;
            } else {
                toast.error(result.message);
                return result;
            }
        } catch (error) {
            const message = error.message || 'Registration failed';
            toast.error(message);
            return { success: false, message };
        } finally {
            setLoadingUser(false);
        }
    };

    const enhancedLogout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setToken(null);
            setProjects([]);
            setSelectedProject(null);
            setChats([]);
            setSelectedChat(null);
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local state even if API call fails
            setUser(null);
            setToken(null);
            setProjects([]);
            setSelectedProject(null);
            setChats([]);
            setSelectedChat(null);
        }
    };

    // Check for OAuth callback on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth');
        const tokenFromUrl = urlParams.get('token');

        if (authSuccess === 'success' && tokenFromUrl) {
            // Handle OAuth success
            if (authService.handleOAuthCallback(tokenFromUrl)) {
                setToken(tokenFromUrl);
                toast.success('Google login successful!');
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } else if (urlParams.get('error') === 'auth_failed') {
            toast.error('Google authentication failed. Please try again.');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const value = {
        navigate, 
        user, setUser, fetchUser,
        projects, setProjects, fetchProjects,
        selectedProject, setSelectedProject,
        chats, setChats, selectedChat, setSelectedChat, 
        theme, setTheme, 
        createNewChat, createNewProject, updateProject, deleteProject,
        loadingUser, fetchUsersChats, 
        token, setToken, 
        axios,
        // Enhanced Authentication
        loginWithGoogle, enhancedLogin, enhancedRegister, enhancedLogout,
        authService,
        // Delete modal functions
        showDeleteConfirmation, cancelDelete, confirmDelete,
        showDeleteModal, itemToDelete
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = ()=> useContext(AppContext)