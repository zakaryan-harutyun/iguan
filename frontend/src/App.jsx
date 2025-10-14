import { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'

function App() {
	const [user, setUser] = useState(null)
	const [projects, setProjects] = useState([])
	const [tasks, setTasks] = useState([])
	const [teamUsers, setTeamUsers] = useState([])
	const [taskComments, setTaskComments] = useState({}) 
	const [editingTask, setEditingTask] = useState({ id: null, title: '' })
	const [initializing, setInitializing] = useState(true)
	const [loadingData, setLoadingData] = useState(false)
	const [creating, setCreating] = useState({ project: false, task: false })
	const [creds, setCreds] = useState({ email: 'admin@example.com', password: 'password' })
    const [loginError, setLoginError] = useState('')
	const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', password_confirmation: '', team_mode: 'create', team_name: '', team_id: '' })
    const [registerErrors, setRegisterErrors] = useState({})
	const [newProjectName, setNewProjectName] = useState('')
	const didInitRef = useRef(false)

	useEffect(() => {
		if (didInitRef.current) return
		didInitRef.current = true
		const token = localStorage.getItem('token')
		if (token) {
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
			axios.get('/api/user')
				.then(r => setUser(r.data))
				.catch(() => {})
				.finally(() => setInitializing(false))
		} else {
			setInitializing(false)
		}
	}, [])

	const login = async () => {
        setLoginError('')
        try {
		const response = await axios.post('/api/login', creds)
		const { user, token } = response.data
		localStorage.setItem('token', token)
		axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
		setUser(user)
        } catch (e) {
            const ve = e?.response?.data
            const emailErr = ve?.errors?.email?.[0]
            const message = emailErr || ve?.message || 'Login failed. Check your credentials.'
            setLoginError(message)
        }
	}

	const register = async () => {
        setRegisterErrors({})
        try {
		const response = await axios.post('/api/register', registerData)
		const { user, token } = response.data
		localStorage.setItem('token', token)
		axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
		setUser(user)
        } catch (e) {
            const errors = e?.response?.data?.errors || {}
            setRegisterErrors(errors)
        }
	}

	const logout = async () => {
		try {
			await axios.post('/api/logout')
		} catch (e) {
		}
		localStorage.removeItem('token')
		delete axios.defaults.headers.common['Authorization']
		setUser(null)
		setProjects([])
		setTasks([])
	}


    useEffect(() => {
        if (user && !initializing) {
            loadData()
        }
    }, [user, initializing])

    const loadData = useCallback(async () => {
        if (loadingData) return
        setLoadingData(true)
        try {
            const [projRes, taskRes, usersRes] = await Promise.all([
			axios.get('/api/projects'),
			axios.get('/api/tasks'),
                axios.get('/api/teams/me/users'),
		])
		setProjects(projRes.data)
		setTasks(taskRes.data)
            setTeamUsers(usersRes.data)
        } finally {
            setLoadingData(false)
	}
    }, [loadingData])

	const createProject = async (name) => {
		if (!name || creating.project) return
		setCreating(c => ({ ...c, project: true }))
		try {
		await axios.post('/api/projects', { name })
			setNewProjectName('')
			await loadData()
		} finally {
			setCreating(c => ({ ...c, project: false }))
		}
	}

	const createTask = async (project_id, title) => {
		if (creating.task) return
		setCreating(c => ({ ...c, task: true }))
		try {
		await axios.post('/api/tasks', { project_id, title })
			await loadData()
		} finally {
			setCreating(c => ({ ...c, task: false }))
		}
	}

	const updateTaskStatus = async (taskId, status) => {
		await axios.post(`/api/tasks/${taskId}/status`, { status })
		await loadData()
	}

	const assignTaskUser = async (taskId, assigned_user_id) => {
		await axios.post(`/api/tasks/${taskId}/assign`, { assigned_user_id })
		await loadData()
	}

	const deleteProject = async (projectId) => {
		await axios.delete(`/api/projects/${projectId}`)
		await loadData()
	}

	const deleteTask = async (taskId) => {
		await axios.delete(`/api/tasks/${taskId}`)
		await loadData()
	}

	const startEditTaskTitle = (task) => {
		setEditingTask({ id: task.id, title: task.title })
	}

	const cancelEditTaskTitle = () => {
		setEditingTask({ id: null, title: '' })
	}

	const saveEditTaskTitle = async () => {
		if (!editingTask.id || !editingTask.title.trim()) return
		await axios.patch(`/api/tasks/${editingTask.id}`, { title: editingTask.title.trim() })
		setEditingTask({ id: null, title: '' })
		await loadData()
	}

	const ensureTaskComments = (taskId) => {
		setTaskComments(prev => prev[taskId] ? prev : { ...prev, [taskId]: { items: [], loading: false, newBody: '' } })
	}

	const loadTaskComments = async (taskId) => {
		ensureTaskComments(taskId)
		setTaskComments(prev => ({ ...prev, [taskId]: { ...(prev[taskId] || {}), loading: true } }))
		try {
			const res = await axios.get(`/api/tasks/${taskId}/comments`)
			setTaskComments(prev => ({ ...prev, [taskId]: { ...(prev[taskId] || {}), items: res.data, loading: false } }))
		} catch (e) {
			setTaskComments(prev => ({ ...prev, [taskId]: { ...(prev[taskId] || {}), loading: false } }))
		}
	}

	const addTaskComment = async (taskId) => {
		const state = taskComments[taskId] || { newBody: '' }
		const body = (state.newBody || '').trim()
		if (!body) return
		await axios.post(`/api/tasks/${taskId}/comments`, { body })
		await loadTaskComments(taskId)
		setTaskComments(prev => ({ ...prev, [taskId]: { ...(prev[taskId] || {}), newBody: '' } }))
	}

	const deleteComment = async (commentId, taskId) => {
		await axios.delete(`/api/comments/${commentId}`)
		await loadTaskComments(taskId)
	}

    if (initializing) {
        return (
            <div className="container py-5 d-flex justify-content-center">
                <div className="spinner-border" role="status" aria-label="Loading" />
            </div>
        )
	}

	if (!user) {
		return (
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card shadow-sm mb-4">
                            <div className="card-body">
                                <h2 className="h4 mb-3">Login</h2>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input className={`form-control${loginError ? ' is-invalid' : ''}`} placeholder="email" value={creds.email} onChange={e => setCreds({ ...creds, email: e.target.value })} />
                                </div>
                                <div className="mb-1">
                                    <label className="form-label">Password</label>
                                    <input className={`form-control${loginError ? ' is-invalid' : ''}`} placeholder="password" type="password" value={creds.password} onChange={e => setCreds({ ...creds, password: e.target.value })} />
                                    {loginError && <div className="invalid-feedback d-block">{loginError}</div>}
                                </div>
                                <button className="btn btn-primary w-100" onClick={login}>Login</button>
                            </div>
                        </div>

                        <div className="card shadow-sm">
                            <div className="card-body">
                                <h3 className="h5 mb-3">Or Register</h3>
                                <div className="mb-3">
                                    <label className="form-label">Name</label>
                                    <input className={`form-control${registerErrors.name ? ' is-invalid' : ''}`} placeholder="name" value={registerData.name} onChange={e => setRegisterData({ ...registerData, name: e.target.value })} />
                                    {registerErrors.name && <div className="invalid-feedback d-block">{registerErrors.name[0]}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input className={`form-control${registerErrors.email ? ' is-invalid' : ''}`} placeholder="email" value={registerData.email} onChange={e => setRegisterData({ ...registerData, email: e.target.value })} />
                                    {registerErrors.email && <div className="invalid-feedback d-block">{registerErrors.email[0]}</div>}
                                </div>
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <label className="form-label">Password</label>
                                        <input className={`form-control${registerErrors.password ? ' is-invalid' : ''}`} placeholder="password" type="password" value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })} />
                                        {registerErrors.password && <div className="invalid-feedback d-block">{registerErrors.password[0]}</div>}
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label">Confirm</label>
                                        <input className={`form-control${registerErrors.password_confirmation ? ' is-invalid' : ''}`} placeholder="confirm" type="password" value={registerData.password_confirmation} onChange={e => setRegisterData({ ...registerData, password_confirmation: e.target.value })} />
                                        {registerErrors.password_confirmation && <div className="invalid-feedback d-block">{registerErrors.password_confirmation[0]}</div>}
                                    </div>
                                </div>
                                <div className="row g-3 mt-1">
                                    <div className="col-12 col-md-6">
                                        <label className="form-label">Team Mode</label>
                                        <select className="form-select" value={registerData.team_mode} onChange={e => setRegisterData({ ...registerData, team_mode: e.target.value })}>
					<option value="create">Create Team</option>
					<option value="join">Join Team</option>
				</select>
                                    </div>
                                    <div className="col-12 col-md-6">
				{registerData.team_mode === 'create' ? (
                                            <>
                                                <label className="form-label">Team Name</label>
                                                <input className={`form-control${registerErrors.team_name ? ' is-invalid' : ''}`} placeholder="team name" value={registerData.team_name} onChange={e => setRegisterData({ ...registerData, team_name: e.target.value })} />
                                                {registerErrors.team_name && <div className="invalid-feedback d-block">{registerErrors.team_name[0]}</div>}
                                            </>
                                        ) : (
                                            <>
                                                <label className="form-label">Team ID</label>
                                                <input className={`form-control${registerErrors.team_id ? ' is-invalid' : ''}`} placeholder="team id" value={registerData.team_id} onChange={e => setRegisterData({ ...registerData, team_id: e.target.value })} />
                                                {registerErrors.team_id && <div className="invalid-feedback d-block">{registerErrors.team_id[0]}</div>}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button className="btn btn-success w-100 mt-3" onClick={register}>Register</button>
                            </div>
                        </div>
                    </div>
                </div>
			</div>
		)
	}

	return (
        <div>
            <nav className="navbar navbar-expand-lg bg-body-tertiary">
                <div className="container">
                    <a className="navbar-brand" href="#">Iguan</a>
                    <div className="ms-auto d-flex align-items-center gap-2">
                        <span className="small text-muted">{user.name} ({user.role})</span>
                        <button className="btn btn-outline-secondary btn-sm" onClick={loadData} disabled={loadingData}>
                            {loadingData ? 'Refreshing…' : 'Refresh'}
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={logout}>Logout</button>
                    </div>
                </div>
            </nav>

            <div className="container py-4">

            <div className="row g-4">
                <div className="col-12 col-lg-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <h2 className="h5 mb-0">Projects</h2>
			</div>
                            <ul className="list-group mb-3">
				{projects.map(p => (
                                    <li key={p.id} className="list-group-item">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="me-auto">{p.name}</span>
                                            <div className="btn-group btn-group-sm" role="group">
                                                <button className="btn btn-primary" onClick={() => createTask(p.id, 'New Task')} disabled={creating.task}>+ Task</button>
                                                <button className="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target={`#confirmDeleteProject-${p.id}`}>Delete</button>
                                            </div>
                                        </div>

                                        <div className="modal fade" id={`confirmDeleteProject-${p.id}`} tabIndex="-1" aria-hidden="true">
                                            <div className="modal-dialog">
                                                <div className="modal-content">
                                                    <div className="modal-header">
                                                        <h1 className="modal-title fs-5">Delete Project</h1>
                                                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                    </div>
                                                    <div className="modal-body">This action cannot be undone. Delete project "{p.name}"?</div>
                                                    <div className="modal-footer">
                                                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                        <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={() => deleteProject(p.id)}>Delete</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
					</li>
				))}
                                {projects.length === 0 && (
                                    <li className="list-group-item text-muted">No projects yet</li>
                                )}
			</ul>
                            <div className="input-group">
                                <input className="form-control" placeholder="New project name" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
                                <button className="btn btn-success" onClick={() => createProject(newProjectName)} disabled={!newProjectName || creating.project}>
                                    {creating.project ? 'Adding…' : 'Add Project'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-8">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <h2 className="h5 mb-0">Tasks</h2>
                            </div>
                            <ul className="list-group">
				{tasks.map(t => (
                                    <li key={t.id} className="list-group-item">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="me-auto">
                                                {editingTask.id === t.id ? (
                                                    <div className="input-group input-group-sm" style={{maxWidth: 420}}>
                                                        <input style={{width: '100%'}} className="form-control" value={editingTask.title} onChange={e => setEditingTask(et => ({ ...et, title: e.target.value }))} />
                                                        <button className="btn btn-success" onClick={saveEditTaskTitle}>Save</button>
                                                        <button className="btn btn-outline-secondary" onClick={cancelEditTaskTitle}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <div className="fw-semibold">{t.title}</div>
                                                )}
                                                <div className="small text-muted d-flex align-items-center gap-2">
                                                    <span className={`badge ${t.status === 'completed' ? 'bg-success' : t.status === 'in_progress' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{t.status.replace('_', ' ')}</span>
                                                    {t.assigned_user?.name && <span className="text-muted">{t.assigned_user.name}</span>}
                                                </div>
                                            </div>
                                            {editingTask.id !== t.id && (
                                                <button className="btn btn-outline-primary btn-sm" onClick={() => startEditTaskTitle(t)}>Edit</button>
                                            )}
                                            <select className="form-select form-select-sm" style={{maxWidth: 170}} value={t.status} onChange={e => updateTaskStatus(t.id, e.target.value)}>
                                                <option value="not_started">Not Started</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                            <select className="form-select form-select-sm" style={{maxWidth: 200}} value={t.assigned_user?.id || ''} onChange={e => assignTaskUser(t.id, e.target.value)}>
                                                <option value="">Unassigned</option>
                                                {teamUsers.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                            <button className="btn btn-outline-secondary btn-sm" onClick={() => loadTaskComments(t.id)} data-bs-toggle="collapse" data-bs-target={`#task-comments-${t.id}`} aria-expanded="false">Comments</button>
                                            <button className="btn btn-outline-danger btn-sm" data-bs-toggle="modal" data-bs-target={`#confirmDeleteTask-${t.id}`}>Delete</button>
                                        </div>

                                        <div className="modal fade" id={`confirmDeleteTask-${t.id}`} tabIndex="-1" aria-hidden="true">
                                            <div className="modal-dialog">
                                                <div className="modal-content">
                                                    <div className="modal-header">
                                                        <h1 className="modal-title fs-5">Delete Task</h1>
                                                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                    </div>
                                                    <div className="modal-body">Delete task "{t.title}"?</div>
                                                    <div className="modal-footer">
                                                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                                        <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={() => deleteTask(t.id)}>Delete</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div id={`task-comments-${t.id}`} className="collapse mt-3">
                                            <div className="mb-2">
                                                {taskComments[t.id]?.loading ? (
                                                    <div className="text-muted small">Loading comments…</div>
                                                ) : (
                                                    <ul className="list-group">
                                                        {(taskComments[t.id]?.items || []).map(c => (
                                                            <li key={c.id} className="list-group-item d-flex align-items-start">
                                                                <div className="me-auto">
                                                                    <div className="small"><strong>{c.user?.name || 'User'}</strong> <span className="text-muted">{new Date(c.created_at).toLocaleString()}</span></div>
                                                                    <div>{c.body}</div>
                                                                </div>
                                                                {(user.role === 'admin' || user.id === c.user_id) && (
                                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteComment(c.id, t.id)}>Delete</button>
                                                                )}
                                                            </li>
                                                        ))}
                                                        {(taskComments[t.id]?.items || []).length === 0 && (
                                                            <li className="list-group-item text-muted">No comments yet</li>
                                                        )}
                                                    </ul>
                                                )}
                                            </div>
                                            <div className="input-group">
                                                <input className="form-control" placeholder="Add a comment" value={taskComments[t.id]?.newBody || ''} onChange={e => setTaskComments(prev => ({ ...prev, [t.id]: { ...(prev[t.id] || {}), newBody: e.target.value } }))} />
                                                <button className="btn btn-primary" onClick={() => addTaskComment(t.id)}>Post</button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {tasks.length === 0 && (
                                    <li className="list-group-item text-muted">No tasks yet</li>
                                )}
			</ul>
                        </div>
                    </div>
                </div>
            </div>
            </div>
		</div>
	)
}

export default App
