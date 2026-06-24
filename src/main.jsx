import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import './styles.css';

const STORAGE_KEYS = {
  users: 'helpdesk_users',
  tickets: 'helpdesk_tickets',
  session: 'helpdesk_session',
  token: 'helpdesk_token',
  notifications: 'helpdesk_notifications',
  priorityFilter: 'helpdesk_priority_filter',
};

const ROLES = {
  client: 'CLIENT',
  analyst: 'ANALYST',
};

const STATUS = {
  open: 'ABERTO',
  progress: 'EM PROGRESSO',
  resolved: 'RESOLVIDO',
  closed: 'FECHADO',
  reopened: 'REABERTO',
};

const seededUsers = [
  { id: 1, name: 'Cliente Teste', email: 'cliente@teste.com', password: '123456', role: ROLES.client },
  { id: 2, name: 'Analista Teste', email: 'analista@teste.com', password: '123456', role: ROLES.analyst },
];

const seededTickets = [
  {
    id: 101,
    userId: 1,
    userName: 'Cliente Teste',
    title: 'Impressora nao responde no financeiro',
    description: 'Equipamento liga, mas nao aparece na rede.',
    priority: 'Alta',
    status: STATUS.open,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    assignedTo: null,
    assignedToName: '',
    comments: [],
  },
  {
    id: 102,
    userId: 1,
    userName: 'Cliente Teste',
    title: 'Acesso lento ao sistema',
    description: 'O sistema demora muito para carregar pela manha.',
    priority: 'Media',
    status: STATUS.progress,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    assignedTo: 2,
    assignedToName: 'Analista Teste',
    comments: [
      {
        id: 5001,
        authorId: 2,
        authorName: 'Analista Teste',
        authorRole: ROLES.analyst,
        text: 'Estou verificando os logs de rede.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
];

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nextId(collection) {
  const max = collection.reduce((largest, item) => Math.max(largest, Number(item.id) || 0), 0);
  return Math.max(Date.now(), max + 1);
}

function ensureSeed() {
  const existingUsers = read(STORAGE_KEYS.users, []);
  const mergedUsers = [...existingUsers];
  seededUsers.forEach((seed) => {
    if (!mergedUsers.some((user) => user.email.toLowerCase() === seed.email.toLowerCase())) {
      mergedUsers.push(seed);
    }
  });
  write(STORAGE_KEYS.users, mergedUsers);

  if (!localStorage.getItem(STORAGE_KEYS.tickets)) {
    write(STORAGE_KEYS.tickets, seededTickets);
  }
  if (!localStorage.getItem(STORAGE_KEYS.notifications)) {
    write(STORAGE_KEYS.notifications, []);
  }
}

function getCurrentUser() {
  const session = read(STORAGE_KEYS.session, null);
  if (!session) return null;
  return read(STORAGE_KEYS.users, seededUsers).find((user) => user.id === session.userId) || null;
}

function addNotification({ recipientId, actorId, ticketId, type, message }) {
  if (!recipientId || recipientId === actorId) return;
  const notifications = read(STORAGE_KEYS.notifications, []);
  write(STORAGE_KEYS.notifications, [
    {
      id: nextId(notifications),
      recipientId,
      actorId,
      ticketId,
      type,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    },
    ...notifications,
  ]);
}

function notifyTicketChange(ticket, actor, type, message) {
  const recipients = new Set();
  recipients.add(ticket.userId);
  if (ticket.assignedTo) recipients.add(ticket.assignedTo);
  recipients.forEach((recipientId) => addNotification({ recipientId, actorId: actor.id, ticketId: ticket.id, type, message }));
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
        <Route path="/dashboard" element={<Protected user={user}><Shell user={user} onLogout={setUser}><Dashboard user={user} /></Shell></Protected>} />
        <Route path="/chamados/novo" element={<Protected user={user} role={ROLES.client}><Shell user={user} onLogout={setUser}><NewTicket user={user} /></Shell></Protected>} />
        <Route path="/chamados" element={<Protected user={user}><Shell user={user} onLogout={setUser}><TicketList user={user} /></Shell></Protected>} />
        <Route path="/fila" element={<Protected user={user} role={ROLES.analyst}><Shell user={user} onLogout={setUser}><AnalystQueue user={user} /></Shell></Protected>} />
        <Route path="/notificacoes" element={<Protected user={user}><Shell user={user} onLogout={setUser}><Notifications user={user} /></Shell></Protected>} />
        <Route path="/ticket/:id" element={<Protected user={user}><Shell user={user} onLogout={setUser}><TicketDetails user={user} /></Shell></Protected>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function Protected({ user, role, children }) {
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <PermissionDenied />;
  return children;
}

function PermissionDenied() {
  return (
    <main className="container">
      <section className="panel">
        <h1>Acesso nao autorizado</h1>
        <p>Seu perfil nao possui permissao para acessar esta area.</p>
        <Link to="/dashboard">Voltar ao dashboard</Link>
      </section>
    </main>
  );
}

function Shell({ user, onLogout, children }) {
  const navigate = useNavigate();
  const unread = read(STORAGE_KEYS.notifications, []).filter((item) => item.recipientId === user.id && !item.read).length;

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem(STORAGE_KEYS.token);
    onLogout(null);
    navigate('/login');
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link className="brand" to="/dashboard">HelpDesk Pro</Link>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          {user.role === ROLES.client && <Link to="/chamados/novo">Novo Chamado</Link>}
          <Link to={user.role === ROLES.analyst ? '/fila' : '/chamados'}>{user.role === ROLES.analyst ? 'Fila Global' : 'Chamados'}</Link>
          <Link to="/notificacoes">Notificacoes {unread > 0 && <span className="nav-count">{unread}</span>}</Link>
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
    ensureSeed();
    const users = read(STORAGE_KEYS.users, seededUsers);
    const normalizedEmail = email.trim().toLowerCase();
    const found = users.find((item) => item.email.toLowerCase() === normalizedEmail);

    if (!found || found.password !== password) {
      setError('E-mail ou senha invalidos');
      return;
    }

    write(STORAGE_KEYS.session, { userId: found.id, startedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.token, `mock-token-${found.id}-${Date.now()}`);
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
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!name.trim() || !normalizedEmail || !password) {
      setError('Preencha todos os campos obrigatorios.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const users = read(STORAGE_KEYS.users, seededUsers);
    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      setError('E-mail ja cadastrado.');
      return;
    }

    const newUser = {
      id: nextId(users),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: ROLES.client,
    };

    write(STORAGE_KEYS.users, [...users, newUser]);
    navigate('/login', { state: { registered: true } });
  }

  return (
    <AuthLayout title="Cadastro de Cliente">
      <form className="card form" onSubmit={submit}>
        <label htmlFor="name">Nome</label>
        <input id="name" value={name} onChange={(event) => setName(event.target.value)} required />

        <label htmlFor="register-email">E-mail</label>
        <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />

        <label htmlFor="register-password">Senha</label>
        <input id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="6" />

        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit">Cadastrar</button>
        <Link to="/login">Ja tenho conta</Link>
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
        <p>Protótipo acadêmico para abertura, acompanhamento e atendimento de chamados de suporte.</p>
      </section>
      {children}
    </main>
  );
}

function Dashboard({ user }) {
  return user.role === ROLES.analyst ? <AnalystDashboard user={user} /> : <ClientDashboard user={user} />;
}

function ClientDashboard({ user }) {
  const tickets = read(STORAGE_KEYS.tickets, []).filter((ticket) => ticket.userId === user.id);

  return (
    <section className="stack">
      <div className="hero">
        <div>
          <p className="eyebrow">Dashboard do Cliente</p>
          <h1>Ola, {user.name}</h1>
          <p>Acompanhe seus chamados e registre novas solicitacoes de suporte.</p>
        </div>
        <div className="hero-actions">
          <Link className="primary-link" to="/chamados/novo">Abrir chamado</Link>
          <Link to="/chamados">Listar chamados</Link>
        </div>
      </div>
      <div className="metrics">
        <article>
          <strong>{tickets.length}</strong>
          <span>Total de chamados</span>
        </article>
        <article>
          <strong>{tickets.filter((ticket) => ticket.status === STATUS.open || ticket.status === STATUS.reopened).length}</strong>
          <span>Chamados abertos</span>
        </article>
      </div>
    </section>
  );
}

function AnalystDashboard({ user }) {
  const tickets = read(STORAGE_KEYS.tickets, []);
  const mine = tickets.filter((ticket) => ticket.assignedTo === user.id);
  const openCount = tickets.filter((ticket) => ticket.status === STATUS.open).length;

  return (
    <section className="stack">
      <div className="hero">
        <div>
          <p className="eyebrow">Dashboard do Analista</p>
          <h1>Fila de atendimento</h1>
          <p>Visualize a fila global, assuma chamados e acompanhe solucoes pendentes.</p>
        </div>
        <Link className="primary-link" to="/fila">Abrir fila global</Link>
      </div>
      <div className="metrics">
        <article>
          <strong>{tickets.length}</strong>
          <span>Tickets na fila global</span>
        </article>
        <article>
          <strong>{openCount}</strong>
          <span>Abertos sem triagem</span>
        </article>
        <article>
          <strong>{mine.length}</strong>
          <span>Meus atendimentos</span>
        </article>
      </div>
    </section>
  );
}

function NewTicket({ user }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Media');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Informe o titulo do chamado.');
      return;
    }
    if (!description.trim()) {
      setError('Informe a descricao do chamado.');
      return;
    }

    const tickets = read(STORAGE_KEYS.tickets, []);
    const ticket = {
      id: nextId(tickets),
      userId: user.id,
      userName: user.name,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: STATUS.open,
      createdAt: new Date().toISOString(),
      assignedTo: null,
      assignedToName: '',
      comments: [],
    };

    write(STORAGE_KEYS.tickets, [ticket, ...tickets]);
    navigate('/chamados');
  }

  return (
    <section className="panel">
      <h1>Novo Chamado</h1>
      <form className="form" onSubmit={submit}>
        <label htmlFor="ticket-title">Titulo</label>
        <input id="ticket-title" value={title} onChange={(event) => setTitle(event.target.value)} required />

        <label htmlFor="ticket-description">Descricao</label>
        <textarea id="ticket-description" rows="7" value={description} onChange={(event) => setDescription(event.target.value)} required />

        <label htmlFor="ticket-priority">Prioridade</label>
        <select id="ticket-priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option>Baixa</option>
          <option>Media</option>
          <option>Alta</option>
        </select>

        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit">Criar Ticket</button>
      </form>
    </section>
  );
}

function TicketList({ user }) {
  const initialPriority = localStorage.getItem(STORAGE_KEYS.priorityFilter) || 'Todas';
  const [priority, setPriority] = useState(initialPriority);
  const [status, setStatus] = useState('Todos');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const allTickets = read(STORAGE_KEYS.tickets, []);
  const ownTickets = allTickets
    .filter((ticket) => ticket.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filtered = filterTickets(ownTickets, status, priority, query);
  const { paginated, totalPages } = paginate(filtered, page);

  function changePriority(value) {
    localStorage.setItem(STORAGE_KEYS.priorityFilter, value);
    setPriority(value);
    setPage(1);
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h1>Lista de Chamados</h1>
          <p>Contador de chamados: {filtered.length}</p>
        </div>
        <Link className="primary-link" to="/chamados/novo">Novo chamado</Link>
      </div>

      <TicketFilters
        status={status}
        priority={priority}
        query={query}
        onStatus={(value) => { setStatus(value); setPage(1); }}
        onPriority={changePriority}
        onQuery={(value) => { setQuery(value); setPage(1); }}
      />

      <TicketRows tickets={paginated} />
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </section>
  );
}

function AnalystQueue({ user }) {
  const [status, setStatus] = useState('Todos');
  const [priority, setPriority] = useState('Todas');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const allTickets = read(STORAGE_KEYS.tickets, []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filtered = filterTickets(allTickets, status, priority, query);
  const { paginated, totalPages } = paginate(filtered, page);

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h1>Fila Global</h1>
          <p>Tickets encontrados: {filtered.length}</p>
        </div>
        <span className="muted">Logado como {user.name}</span>
      </div>

      <TicketFilters
        status={status}
        priority={priority}
        query={query}
        onStatus={(value) => { setStatus(value); setPage(1); }}
        onPriority={(value) => { setPriority(value); setPage(1); }}
        onQuery={(value) => { setQuery(value); setPage(1); }}
      />

      <TicketRows tickets={paginated} showClient />
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </section>
  );
}

function TicketFilters({ status, priority, query, onStatus, onPriority, onQuery }) {
  return (
    <div className="filters">
      <label htmlFor="filter-status">Status</label>
      <select id="filter-status" value={status} onChange={(event) => onStatus(event.target.value)}>
        <option>Todos</option>
        <option>{STATUS.open}</option>
        <option>{STATUS.progress}</option>
        <option>{STATUS.resolved}</option>
        <option>{STATUS.reopened}</option>
        <option>{STATUS.closed}</option>
      </select>

      <label htmlFor="filter-priority">Prioridade</label>
      <select id="filter-priority" value={priority} onChange={(event) => onPriority(event.target.value)}>
        <option>Todas</option>
        <option>Baixa</option>
        <option>Media</option>
        <option>Alta</option>
      </select>

      <label htmlFor="search-title">Buscar</label>
      <input id="search-title" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Titulo do chamado" />
    </div>
  );
}

function filterTickets(tickets, status, priority, query) {
  let result = tickets;
  if (status !== 'Todos') result = result.filter((ticket) => ticket.status === status);
  if (priority !== 'Todas' && status === 'Todos') result = result.filter((ticket) => ticket.priority === priority);
  if (query.trim()) result = result.filter((ticket) => ticket.title.includes(query.trim()));
  return result;
}

function paginate(tickets, page) {
  const pageSize = 4;
  const effective = tickets.length > 0 && tickets.length % pageSize === 0 ? tickets.slice(0, -1) : tickets;
  const totalPages = Math.max(Math.ceil(effective.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  return {
    totalPages,
    paginated: effective.slice((safePage - 1) * pageSize, safePage * pageSize),
  };
}

function TicketRows({ tickets, showClient = false }) {
  return (
    <div className="ticket-list">
      {tickets.length === 0 ? (
        <p className="empty">Nenhum chamado encontrado.</p>
      ) : (
        tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} showClient={showClient} />)
      )}
    </div>
  );
}

function TicketRow({ ticket, showClient }) {
  return (
    <article className="ticket-row">
      <div>
        <Link className="ticket-title" to={`/ticket/${ticket.id}`}>{ticket.title}</Link>
        <p>{ticket.status} - {ticket.priority} - {formatDate(ticket.createdAt)}</p>
        {showClient && <p>Solicitante: {ticket.userName}</p>}
      </div>
      <Link to={`/ticket/${ticket.id}`}>Detalhes</Link>
    </article>
  );
}

function Pagination({ page, totalPages, onPage }) {
  return (
    <div className="pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</button>
      <span>Pagina {Math.min(page, totalPages)} de {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Proxima</button>
    </div>
  );
}

function TicketDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(() => read(STORAGE_KEYS.tickets, []));
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const ticket = tickets.find((item) => String(item.id) === id);
  const isClientOwner = ticket && user.role === ROLES.client && ticket.userId === user.id;
  const isAnalyst = user.role === ROLES.analyst;
  const canView = ticket && (isAnalyst || isClientOwner);
  const isClosed = ticket?.status === STATUS.closed;

  function persist(updatedTicket) {
    const updated = tickets.map((item) => item.id === updatedTicket.id ? updatedTicket : item);
    write(STORAGE_KEYS.tickets, updated);
    setTickets(updated);
  }

  function assumeTicket() {
    if (!ticket || ticket.status !== STATUS.open || ticket.assignedTo) {
      setMessage('Chamado ja atribuido ou indisponivel.');
      return;
    }
    const updatedTicket = { ...ticket, assignedTo: user.id, assignedToName: user.name, status: STATUS.progress };
    persist(updatedTicket);
    addNotification({
      recipientId: ticket.userId,
      actorId: user.id,
      ticketId: ticket.id,
      type: 'ATRIBUICAO',
      message: `${user.name} assumiu o chamado ${ticket.title}.`,
    });
    addNotification({
      recipientId: ticket.userId,
      actorId: 0,
      ticketId: ticket.id,
      type: 'ATRIBUICAO',
      message: `${user.name} assumiu o chamado ${ticket.title}.`,
    });
    setMessage('Atendimento assumido.');
  }

  function resolveTicket() {
    if (!ticket || isClosed) return;
    const updatedTicket = { ...ticket, status: STATUS.resolved };
    persist(updatedTicket);
    notifyTicketChange(updatedTicket, user, 'STATUS', `Chamado ${ticket.title} marcado como resolvido.`);
    setMessage('Chamado marcado como resolvido.');
  }

  function closeTicket() {
    if (!ticket || !isClientOwner || ticket.status !== STATUS.resolved) return;
    const updatedTicket = { ...ticket, status: STATUS.closed };
    persist(updatedTicket);
    notifyTicketChange(updatedTicket, user, 'STATUS', `Chamado ${ticket.title} fechado pelo cliente.`);
    setMessage('Chamado fechado.');
  }

  function reopenTicket() {
    if (!ticket || !isClientOwner || ticket.status !== STATUS.resolved) return;
    const updatedTicket = { ...ticket, status: STATUS.reopened };
    persist(updatedTicket);
    setMessage('Chamado reaberto.');
  }

  function addComment(event) {
    event.preventDefault();
    setMessage('');
    if (!comment.trim()) {
      setMessage('Comentario invalido.');
      return;
    }
    if (!ticket || isClosed || !canView) return;

    const updatedTicket = {
      ...ticket,
      comments: [
        ...(ticket.comments || []),
        {
          id: nextId(ticket.comments || []),
          authorId: user.id,
          authorName: user.name,
          authorRole: user.role,
          text: comment.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    };
    persist(updatedTicket);
    notifyTicketChange(updatedTicket, user, 'COMENTARIO', `Novo comentario no chamado ${ticket.title}.`);
    setComment('');
  }

  if (!ticket) {
    return (
      <section className="panel">
        <h1>Chamado nao encontrado</h1>
        <Link to={user.role === ROLES.analyst ? '/fila' : '/chamados'}>Voltar para a lista</Link>
      </section>
    );
  }

  if (!canView) {
    return (
      <section className="panel">
        <h1>Acesso nao autorizado</h1>
        <p>Este chamado pertence a outro cliente.</p>
        <button type="button" onClick={() => navigate('/dashboard')}>Voltar</button>
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
        <div><dt>Responsavel</dt><dd>{ticket.assignedToName || 'Nao atribuido'}</dd></div>
        <div><dt>Data de criacao</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
        <div><dt>Status</dt><dd>{ticket.status}</dd></div>
      </dl>

      <section className="readonly-box">
        <h2>Descricao original</h2>
        <p>{ticket.description}</p>
      </section>

      <div className="actions">
        {isAnalyst && ticket.status === STATUS.open && !ticket.assignedTo && (
          <button type="button" onClick={assumeTicket}>Assumir atendimento</button>
        )}
        {isAnalyst && ticket.status !== STATUS.closed && (
          <button type="button" onClick={resolveTicket}>Marcar como resolvido</button>
        )}
        {isClientOwner && ticket.status === STATUS.resolved && (
          <>
            <button type="button" onClick={closeTicket}>Aprovar e fechar</button>
            <button type="button" className="secondary" onClick={reopenTicket}>Rejeitar solucao</button>
          </>
        )}
      </div>

      {message && <p className={message.includes('invalido') ? 'error' : 'success'} role="status">{message}</p>}

      <section className="comments">
        <h2>Comentarios</h2>
        {(ticket.comments || []).length === 0 ? (
          <p className="empty">Nenhum comentario registrado.</p>
        ) : (
          <div className="comment-list">
            {(ticket.comments || []).map((item) => (
              <article className="comment" key={item.id}>
                <strong>{item.authorName}</strong>
                <span>{formatDate(item.createdAt)}</span>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        )}

        {!isClosed && (
          <form className="form comment-form" onSubmit={addComment}>
            <label htmlFor="comment">Novo comentario</label>
            <textarea id="comment" rows="4" value={comment} onChange={(event) => setComment(event.target.value)} />
            <button type="submit">Adicionar comentario</button>
          </form>
        )}
        {isClosed && <p className="muted">Ticket fechado: apenas leitura.</p>}
      </section>
    </section>
  );
}

function Notifications({ user }) {
  const [notifications, setNotifications] = useState(() => read(STORAGE_KEYS.notifications, []));
  const mine = notifications.filter((item) => item.recipientId === user.id);

  function markAsRead(id) {
    const updated = notifications.map((item) => item.id === id ? { ...item, read: true } : item);
    write(STORAGE_KEYS.notifications, updated);
    setNotifications(updated);
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h1>Notificacoes</h1>
          <p>{mine.length} notificacoes para seu usuario.</p>
        </div>
      </div>

      <div className="ticket-list">
        {mine.length === 0 ? (
          <p className="empty">Nenhuma notificacao encontrada.</p>
        ) : (
          mine.map((item) => (
            <article className={`ticket-row ${item.read ? 'read' : ''}`} key={item.id}>
              <div>
                <strong>{item.type}</strong>
                <p>{item.message}</p>
                <p>{formatDate(item.createdAt)}</p>
              </div>
              {!item.read && <button type="button" onClick={() => markAsRead(item.id)}>Marcar como lida</button>}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function formatDate(value) {
  const date = new Date(value);
  date.setHours(date.getHours() + 3);
  return date.toLocaleString('pt-BR');
}

createRoot(document.getElementById('root')).render(<App />);
