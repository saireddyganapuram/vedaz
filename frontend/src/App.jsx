// This is a complete, self-contained React application.
// You would typically have this structured into separate files and folders.
// To run this:
// 1. Use Create React App: `npx create-react-app chat-app-frontend`
// 2. Install dependencies: `npm install axios socket.io-client tailwindcss`
// 3. Configure Tailwind CSS.
// 4. Replace the content of `src/App.js` with this code.
// 5. Make sure the backend server is running.

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

// --- Configuration ---
const API_URL = 'http://localhost:5000/api'; // Your backend API URL
const SOCKET_URL = 'http://localhost:5000'; // Your backend socket URL

// --- Context for Authentication and Socket ---
const AuthContext = createContext();
const SocketContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [token, setToken] = useState(localStorage.getItem('token'));

    const login = (userData, authToken) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
        setUser(userData);
        setToken(authToken);
        axios.defaults.headers.common['x-auth-token'] = authToken;
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        delete axios.defaults.headers.common['x-auth-token'];
    };
    
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['x-auth-token'] = token;
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user) {
            const newSocket = io(SOCKET_URL);
            
            newSocket.on('connect', () => {
                console.log('Socket connected successfully:', newSocket.id);
                newSocket.emit('user:online', user.id);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected.');
            });

            setSocket(newSocket);

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

// --- Main App Component ---
function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

function AppContent() {
    const { user } = useContext(AuthContext);
    return (
        <div className="font-sans antialiased text-gray-900 bg-gray-100">
            {user ? (
                <SocketProvider>
                    <Chat />
                </SocketProvider>
            ) : (
                <Auth />
            )}
        </div>
    );
}

// --- Authentication Components ---
function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                </div>
                {isLogin ? <Login /> : <Register />}
                <div className="text-sm text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-indigo-600 hover:text-indigo-500">
                        {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { username, password });
            login(res.data.user, res.data.token);
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed');
        }
    };

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                    <input value={username} onChange={e => setUsername(e.target.value)} name="username" type="text" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Username" />
                </div>
                <div>
                    <input value={password} onChange={e => setPassword(e.target.value)} name="password" type="password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password" />
                </div>
            </div>
            <div>
                <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Sign in
                </button>
            </div>
        </form>
    );
}

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        try {
            const res = await axios.post(`${API_URL}/auth/register`, { username, password });
            login(res.data.user, res.data.token);
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed');
        }
    };

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
             {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                    <input value={username} onChange={e => setUsername(e.target.value)} name="username" type="text" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Username" />
                </div>
                <div>
                    <input value={password} onChange={e => setPassword(e.target.value)} name="password" type="password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password" />
                </div>
            </div>
            <div>
                <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Sign up
                </button>
            </div>
        </form>
    );
}


// --- Chat Components ---
function Chat() {
    const [selectedUser, setSelectedUser] = useState(null);
    const { user } = useContext(AuthContext);
    const socket = useContext(SocketContext);

    if (!user || !user.id) {
        return null;
    }

    return (
        <div className="h-screen w-full flex">
            <UserList onUserSelect={setSelectedUser} selectedUser={selectedUser} />
            <ChatWindow selectedUser={selectedUser} />
        </div>
    );
}

function UserList({ onUserSelect, selectedUser }) {
    const [users, setUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [lastMessages, setLastMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { logout, user: currentUser } = useContext(AuthContext);
    const socket = useContext(SocketContext);

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUser || !currentUser.id) {
                console.log('No current user, skipping user fetch');
                return;
            }
            try {
                const res = await axios.get(`${API_URL}/users`);
                // Validate users before setting state
                const validUsers = Array.isArray(res.data) 
                    ? res.data.filter(user => 
                        user && 
                        typeof user === 'object' && 
                        user.username && 
                        typeof user.username === 'string' && 
                        user.username.length > 0 &&
                        user._id &&
                        user._id !== currentUser.id  // Don't include current user
                    )
                    : [];
                setUsers(validUsers);
            } catch (err) {
                console.error('Failed to fetch users', err);
                setUsers([]); // Set empty array on error
            }
        };
        fetchUsers();
    }, [currentUser]);

    useEffect(() => {
        const fetchLastMessages = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/lastMessage/last/${currentUser.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLastMessages(res.data);
            } catch (err) {
                console.error('Failed to fetch last messages', err);
            }
        };
        if (currentUser) fetchLastMessages();
    }, [currentUser]);

    useEffect(() => {
        if (!socket) return;
        
        socket.emit('users:get_online');
        
        socket.on('users:online', (onlineUserIds) => {
            console.log('Received online users list:', onlineUserIds);
            setOnlineUsers(onlineUserIds);
        });

        return () => {
            socket.off('users:online');
        };
    }, [socket]);

    if (!currentUser || !currentUser.username) {
        return null; // or return a loading state
    }

    return (
        <div className="w-1/4 bg-gray-200 border-r border-gray-300">
            <div className="p-4 border-b border-gray-300 flex justify-between items-center">
                <h2 className="text-xl font-bold">{currentUser.username}</h2>
                <button onClick={logout} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Logout</button>
            </div>
            <div className="px-4 py-2 border-b border-gray-300">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>
            <div className="overflow-y-auto">
                {Array.isArray(users) && filteredUsers
                    .filter(user => 
                        user && 
                        typeof user === 'object' && 
                        user.username && 
                        typeof user.username === 'string' && 
                        user.username.length > 0 &&
                        user._id
                    )
                    .map((user) => (
                    <div
                        key={user._id}
                        onClick={() => onUserSelect(user)}
                        className={`p-4 cursor-pointer flex items-center border-b border-gray-300 ${selectedUser && selectedUser._id === user._id ? 'bg-gray-300' : 'hover:bg-gray-100'}`}
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-xl">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            {onlineUsers.includes(user._id) && (
                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                            )}
                        </div>
                        <div className="ml-4 w-full">
                            <p className="font-semibold">{user.username}</p>
                            {(() => {
                                const msgObj = lastMessages.find(m => m.userId === user._id);
                                if (msgObj && msgObj.lastMessage) {
                                    return (
                                        <div className="flex justify-between items-center w-full">
                                            <p className="text-xs text-gray-600 truncate max-w-xs">{msgObj.lastMessage}</p>
                                            <p className="text-xs text-gray-400 text-right min-w-[50px]">{msgObj.time ? new Date(msgObj.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                        </div>
                                    );
                                }
                                return <p className="text-xs text-gray-400">No messages yet</p>;
                            })()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ChatWindow({ selectedUser }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useContext(AuthContext);
    const socket = useContext(SocketContext);
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    
    const isReady = user && user.id && selectedUser;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (selectedUser) {
            const fetchMessages = async () => {
                try {
                    const res = await axios.get(`${API_URL}/conversations/${selectedUser._id}/messages`);
                    setMessages(res.data);
                } catch (err) {
                    console.error('Failed to fetch messages', err);
                    setMessages([]);
                }
            };
            fetchMessages();
        } else {
            setMessages([]);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (!socket) return;
        socket.emit('users:get_online');
        socket.on('users:online', (onlineUserIds) => {
            setOnlineUsers(onlineUserIds);
        });
        return () => {
            socket.off('users:online');
        };
    }, [socket]);

    useEffect(() => {
        if (!socket || !user?.id) return;

        const handleNewMessage = (message) => {
            console.log('\n--- Received message:new event on client ---', message);

            // Show message if it's from or to the selected user
            if (selectedUser && message && (
                (message.sender && message.sender._id === selectedUser._id) || 
                message.receiver === user.id
            )) {
                console.log('Message is for the currently selected user or received by current user. Updating UI.');
                setMessages((prev) => [...prev, message]);
                // Emit read receipt if the message is received by the current user
                if (message.receiver === user.id) {
                    socket.emit('message:read', { conversationId: message.conversationId, userId: user.id });
                }
            } else {
                console.log('Message is for another user or no user is selected. Not updating the current chat window UI.');
            }
        };
        
        const handleTypingStart = ({ senderId }) => {
            if (selectedUser && senderId === selectedUser._id) {
                setIsTyping(true);
            }
        };

        const handleTypingStop = ({ senderId }) => {
            if (selectedUser && senderId === selectedUser._id) {
                setIsTyping(false);
            }
        };
        
        const handleReadReceipt = ({ conversationId }) => {
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg.conversationId === conversationId && msg.sender._id === user.id ? { ...msg, status: 'read' } : msg
                )
            );
        };

        socket.on('message:new', handleNewMessage);
        socket.on('typing:start', handleTypingStart);
        socket.on('typing:stop', handleTypingStop);
        socket.on('message:read:receipt', handleReadReceipt);

        return () => {
            socket.off('message:new', handleNewMessage);
            socket.off('typing:start', handleTypingStart);
            socket.off('typing:stop', handleTypingStop);
            socket.off('message:read:receipt', handleReadReceipt);
        };
    }, [socket, selectedUser, user?.id]);
    
    useEffect(() => {
        if (!user?.id || !socket || !selectedUser || !messages.length) return;
        
        const unreadMessages = messages.filter(
            msg => msg.receiver === user.id && msg.status !== 'read'
        );
        
        if (unreadMessages.length > 0) {
            const conversationId = unreadMessages[0].conversationId;
            socket.emit('message:read', { conversationId, userId: user.id });
        }
    }, [socket, selectedUser, messages, user?.id]);


    const handleTyping = () => {
        if (!socket) return;
        socket.emit('typing:start', { senderId: user.id, receiverId: selectedUser._id });
        
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing:stop', { senderId: user.id, receiverId: selectedUser._id });
        }, 2000);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !socket || !user || !user.id || !selectedUser || !selectedUser._id) return;
        
        const messageData = {
            senderId: user.id,
            receiverId: selectedUser._id,
            content: newMessage,
        };
        
        socket.emit('message:send', messageData);
        
        const optimisticMessage = {
            _id: Date.now().toString(),
            sender: { _id: user.id, username: user.username },
            receiver: selectedUser._id,
            content: newMessage,
            createdAt: new Date().toISOString(),
            status: 'sent'
        };
        setMessages(prev => [...prev, optimisticMessage]);

        setNewMessage('');
        clearTimeout(typingTimeoutRef.current);
        socket.emit('typing:stop', { senderId: user.id, receiverId: selectedUser._id });
    };

    if (!isReady) {
        return (
            <div className="w-3/4 flex items-center justify-center bg-white">
                <p className="text-gray-500">
                    {!user || !user.id ? "Please log in to chat" : "Select a user to start chatting"}
                </p>
            </div>
        );
    }

    return (
        <div className="w-3/4 flex flex-col">
            <div className="p-4 bg-gray-200 border-b border-gray-300 flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-xl">
                    {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                    <p className="font-semibold">{selectedUser.username}</p>
                    {isTyping ? (
                        <p className="text-sm text-gray-600">typing...</p>
                    ) : (
                        <p className="text-sm text-gray-600">
                            {onlineUsers.includes(selectedUser._id) ? 'Online' : 'Offline'}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-white">
                {messages.filter(msg => msg && msg.sender && msg.sender._id).map((msg) => (
                    <Message key={msg._id} message={msg} isOwnMessage={msg.sender._id === user.id} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-gray-200 border-t border-gray-300">
                <form onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder="Type a message..."
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </form>
            </div>
        </div>
    );
}

function Message({ message, isOwnMessage }) {
    const ReadReceipt = () => {
        if (message.status === 'read') {
            return <span className="text-red-600">✓✓</span>;
        }
        if (message.status === 'delivered') {
            return <span className="text-black">✓✓</span>;
        }
        return <span className="text-black">✓</span>;
    };

    return (
        <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-4 py-2 max-w-lg ${isOwnMessage ? 'bg-sky-400 text-white' : 'bg-gray-300 text-gray-900'}`}>
                <p>{message.content}</p>
                <div className={`text-xs mt-1 ${isOwnMessage ? 'text-indigo-500' : 'text-gray-600'} flex items-center justify-end`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isOwnMessage && <div className="ml-2">{ReadReceipt()}</div>}
                </div>
            </div>
        </div>
    );
}

export default App;
