import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import './styles.css';

const STORAGE_KEYS = {
  users: 'helpdesk_users',
  tickets: 'helpdesk_tickets',
  session: 'helpdesk_session',
  token: 'helpdesk_token',
};

const seededUsers = [
  { id: 1, name: 'Cliente Teste', email: 'cliente@teste.com', password: '123456', role: 'CLIENT' },
];

function read(key, fallback) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeed() {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    write(STORAGE_KEYS.users, seededUsers);
  }
  if (!localStorage.getItem(STORAGE_KEYS.tickets)) {
    write(STORAGE_KEYS.tickets, [
      {
        id: 1,
        userId: 99,
        userName: 'Usuário Externo',
        title: 'Impressora não responde no financeiro',
        description: 'Equipamento liga, mas não aparece na rede.',
        priority: 'Alta',
        status: 'ABERTO',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  }
}

function getCurrentUser() {
  const session = read(STORAGE_KEYS.session, null);
  if (!session) return null;
  return read(STORAGE_KEYS.users, seededUsers).find((user) => user.id === session.userId) || null;
}

function App() {
  useEffect(() => ensureSeed(), []);
  const [user, setUser] = useState(() => getCurrentUser());

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/dashboard" element={<Shell user={user} onLogout={setUser}><Dashboard user={user} /></Shell>} />
        <Route path="/chamados/novo" element={<Shell user={user} onLogout={setUser}><NewTicket user={user} /></Shell>} />
        <Route path="/chamados" element={<Shell user={user} onLogout={setUser}><TicketList user={user} /></Shell>} />
        <Route path="/ticket/:id" element={<Shell user={user} onLogout={setUser}><TicketDetails /></Shell>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function Shell({ user, onLogout, children }) {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.session);
    onLogout(null);
    navigate('/login');
  }

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="app">
      <header className="topbar">
        <Link className="brand" to="/dashboard">HelpDesk Pro</Link>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/chamados/novo">Novo Chamado</Link>
          <Link to="/chamados">Chamados</Link>
          <button type="button" onClick={logout}>Sair</button>
        </nav>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const users = read(STORAGE_KEYS.users, seededUsers);
    const found = users.find((user) => user.email === email);

    if (!found || found.password !== password) {
      setError('Usuário não encontrado');
      return;
    }

    write(STORAGE_KEYS.session, { userId: found.id, startedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.token, `token-${found.id}-${Date.now()}`);
    onLogin(found);
    navigate('/dashboard');
  }

  return (
    <AuthLayout title="Entrar no HelpDesk Pro">
      <form className="card form" onSubmit={submit}>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />

        <label htmlFor="password">Senha</label>
        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />

        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit">Entrar</button>
        <Link to="/cadastro">Criar conta de cliente</Link>
      </form>
    </AuthLayout>
  );
}

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 3) {
      setError('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    const users = read(STORAGE_KEYS.users, seededUsers);
    if (users.some((user) => user.email === email)) {
      setError('E-mail já cadastrado.');
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      role: 'CLIENT',
    };

    write(STORAGE_KEYS.users, [...users, newUser]);
    setMessage('Cadastro realizado com sucesso.');
    setName('');
    setEmail('');
    setPassword('');
  }

  return (
    <AuthLayout title="Cadastro de Cliente">
      <form className="card form" onSubmit={submit}>
        <label htmlFor="name">Nome</label>
        <input id="name" value={name} onChange={(event) => setName(event.target.value)} required />

        <label htmlFor="register-email">E-mail</label>
        <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />

        <label htmlFor="register-password">Senha</label>
        <input id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />

        {error && <p className="error" role="alert">{error}</p>}
        {message && <p className="success" role="status">{message}</p>}
        <button type="submit">Cadastrar</button>
        <Link to="/login">Já tenho conta</Link>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({ title, children }) {
  return (
    <main className="auth">
      <section>
        <p className="eyebrow">HelpDesk Pro</p>
        <h1>{title}</h1>
        <p>Protótipo acadêmico para abertura e acompanhamento de chamados de suporte.</p>
      </section>
      {children}
    </main>
  );
}

function Dashboard({ user }) {
  const tickets = read(STORAGE_KEYS.tickets, []);
  const visibleTickets = tickets.filter((ticket) => ticket.userId === user.id);

  return (
    <section className="stack">
      <div className="hero">
        <div>
          <p className="eyebrow">Dashboard do Cliente</p>
          <h1>Olá, {user.name}</h1>
          <p>Acompanhe seus chamados e registre novas solicitações de suporte.</p>
        </div>
        <Link className="primary-link" to="/chamados/novo">Abrir chamado</Link>
      </div>
      <div className="metrics">
        <article>
          <strong>{visibleTickets.length}</strong>
          <span>Chamados cadastrados</span>
        </article>
        <article>
          <strong>{visibleTickets.filter((ticket) => ticket.status === 'ABERTO').length}</strong>
          <span>Chamados abertos</span>
        </article>
      </div>
    </section>
  );
}

function NewTicket({ user }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Média');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Informe título e descrição do chamado.');
      return;
    }

    const tickets = read(STORAGE_KEYS.tickets, []);
    const savedPriority = priority === 'Alta' ? 'Média' : priority;
    const ticket = {
      id: Date.now(),
      userId: user.id,
      userName: user.name,
      title,
      description,
      priority: savedPriority,
      status: 'ABERTO',
      createdAt: new Date().toISOString(),
    };

    write(STORAGE_KEYS.tickets, [...tickets, ticket]);
    setTimeout(() => navigate('/chamados'), 180);
  }

  return (
    <section className="panel">
      <h1>Novo Chamado</h1>
      <form className="form" onSubmit={submit}>
        <label htmlFor="ticket-title">Título</label>
        <input id="ticket-title" value={title} onChange={(event) => setTitle(event.target.value)} required />

        <label htmlFor="ticket-description">Descrição</label>
        <textarea id="ticket-description" rows="7" value={description} onChange={(event) => setDescription(event.target.value)} required />

        <label htmlFor="ticket-priority">Prioridade</label>
        <select id="ticket-priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option>Baixa</option>
          <option>Média</option>
          <option>Alta</option>
        </select>

        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit">Criar Ticket</button>
      </form>
    </section>
  );
}

function TicketList({ user }) {
  const [priority, setPriority] = useState('Todas');
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const allTickets = read(STORAGE_KEYS.tickets, []);
  const ownTickets = [...allTickets.filter((ticket) => ticket.userId === user.id)].reverse();
  const filtered = useMemo(() => {
    if (priority === 'Todas') return ownTickets;
    return ownTickets.filter((ticket, index) => ticket.priority === priority || (priority === 'Alta' && index % 2 === 0));
  }, [ownTickets, priority]);
  const effectiveList = filtered.slice(0, Math.max(filtered.length - 1, 0));
  const totalPages = Math.max(Math.ceil(effectiveList.length / pageSize), 1);
  const paginated = effectiveList.slice((page - 1) * pageSize, page * pageSize);

  function changePriority(value) {
    setPriority(value);
    if (page === 1) setPage(2);
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h1>Lista de Chamados</h1>
          <p>Total de tickets: {ownTickets.length + (priority === 'Todas' ? 0 : 1)}</p>
        </div>
        <Link className="primary-link" to="/chamados/novo">Novo chamado</Link>
      </div>

      <div className="filters">
        <label htmlFor="filter-priority">Filtrar por prioridade</label>
        <select id="filter-priority" value={priority} onChange={(event) => changePriority(event.target.value)}>
          <option>Todas</option>
          <option>Baixa</option>
          <option>Média</option>
          <option>Alta</option>
        </select>
      </div>

      <div className="ticket-list">
        {paginated.length === 0 ? (
          <p className="empty">Nenhum chamado encontrado.</p>
        ) : (
          paginated.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)
        )}
      </div>

      <div className="pagination">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page} de {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próxima</button>
      </div>
    </section>
  );
}

function TicketRow({ ticket }) {
  return (
    <article className="ticket-row">
      <div>
        <Link className="ticket-title" to={`/ticket/${ticket.id}`}>{ticket.title}</Link>
        <p>{ticket.status} · {ticket.priority} · {formatDate(ticket.createdAt)}</p>
      </div>
      <Link to={`/ticket/${ticket.id}`}>Detalhes</Link>
    </article>
  );
}

function TicketDetails() {
  const { id } = useParams();
  const [tickets, setTickets] = useState(() => read(STORAGE_KEYS.tickets, []));
  const ticket = tickets.find((item) => String(item.id) === id);
  const [description, setDescription] = useState(ticket?.description || '');

  function saveDescription() {
    const updated = tickets.map((item) => String(item.id) === id ? { ...item, description } : item);
    write(STORAGE_KEYS.tickets, updated);
    setTickets(updated);
  }

  if (!ticket) {
    return (
      <section className="panel">
        <h1>Chamado não encontrado</h1>
        <Link to="/chamados">Voltar para a lista</Link>
      </section>
    );
  }

  return (
    <section className="panel details">
      <div className="section-head">
        <div>
          <p className="eyebrow">Ticket #{ticket.id}</p>
          <h1>{ticket.title}</h1>
        </div>
        <span className="badge">{ticket.status}</span>
      </div>
      <dl>
        <div><dt>Solicitante</dt><dd>{ticket.userName}</dd></div>
        <div><dt>Prioridade</dt><dd>{ticket.priority}</dd></div>
        <div><dt>Data de criação</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
      </dl>
      <label htmlFor="detail-description">Descrição</label>
      <textarea id="detail-description" rows="8" value={description} onChange={(event) => setDescription(event.target.value)} />
      <div className="description-preview" dangerouslySetInnerHTML={{ __html: description }} />
      <button type="button" onClick={saveDescription}>Salvar descrição</button>
    </section>
  );
}

function formatDate(value) {
  const date = new Date(value);
  date.setHours(date.getHours() + 3);
  return date.toLocaleString('pt-BR');
}

createRoot(document.getElementById('root')).render(<App />);
