import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, ChevronDown, CircleAlert, ExternalLink, Grid2X2, Search, X } from 'lucide-react';
import './styles.css';

type Book = { id: string; name: string; image: string };

function parseCsv(text: string): Book[] {
  const rows = text.match(/(?:[^"\r\n]|"(?:[^"]|"")*")+/g) ?? [];
  return rows.slice(1).map((row) => {
    const fields = [...row.matchAll(/(?:^|,)\s*(?:"((?:[^"]|"")*)"|([^,]*))/g)].slice(0, 3)
      .map((match) => (match[1] ?? match[2] ?? '').replace(/""/g, '"').trim());
    return { id: fields[0] ?? '', name: fields[1] ?? '', image: fields[2] ?? '' };
  }).filter((book) => book.name && book.image);
}

function yearOf(name: string) { return name.match(/\b20\d{2}\b/)?.[0] ?? 'Sem ano'; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase(); }

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('Todos os anos');
  const [selected, setSelected] = useState<Book | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/apostilas_url_capa-imagem.csv')
      .then((response) => { if (!response.ok) throw new Error('CSV indisponível'); return response.text(); })
      .then((text) => setBooks(parseCsv(text)))
      .catch(() => setError('Não foi possível carregar o acervo agora. Verifique se o CSV está disponível.'));
  }, []);

  const years = useMemo(() => ['Todos os anos', ...Array.from(new Set(books.map((book) => yearOf(book.name)))).sort().reverse()], [books]);
  const filtered = useMemo(() => books.filter((book) => {
    const normalized = query.toLocaleLowerCase('pt-BR');
    return (!normalized || book.name.toLocaleLowerCase('pt-BR').includes(normalized) || book.id.includes(normalized)) &&
      (year === 'Todos os anos' || yearOf(book.name) === year);
  }), [books, query, year]);

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="/"><span className="brand-mark"><BookOpen size={19} /></span><span>MED<span>GRUPO</span></span></a><div className="topbar-meta"><span className="live-dot" /> Acervo de capas <span className="topbar-divider" /> {books.length.toLocaleString('pt-BR')} títulos</div></header>
    <main>
      <section className="intro"><div><p className="eyebrow">BIBLIOTECA VISUAL</p><h1>Capas de apostilas</h1><p className="intro-copy">Explore o acervo editorial do MEDGRUPO em um só lugar.</p></div><div className="intro-stamp"><Grid2X2 size={17} /><span>CATÁLOGO<br /><strong>2022 — 2026</strong></span></div></section>
      <section className="toolbar" aria-label="Filtros do acervo"><label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título ou ID..." aria-label="Buscar por título ou ID" />{query && <button onClick={() => setQuery('')} aria-label="Limpar busca"><X size={16} /></button>}</label><label className="year-select"><span>Filtrar por</span><select value={year} onChange={(event) => setYear(event.target.value)} aria-label="Filtrar por ano">{years.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={16} /></label></section>
      <div className="results-line"><span><strong>{filtered.length.toLocaleString('pt-BR')}</strong> {filtered.length === 1 ? 'capa encontrada' : 'capas encontradas'}</span><span className="results-note">Clique em uma capa para ampliar</span></div>
      {error ? <div className="state-box"><CircleAlert size={24} /><p>{error}</p></div> : books.length === 0 ? <div className="state-box loading"><div className="spinner" /><p>Carregando capas...</p></div> : filtered.length === 0 ? <div className="state-box"><Search size={24} /><p>Nenhuma capa corresponde à sua busca.</p></div> : <section className="gallery">{filtered.map((book) => <article className="book-card" key={book.id} onClick={() => setSelected(book)} tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && setSelected(book)}><div className="cover-frame"><img src={book.image} alt={`Capa: ${book.name}`} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement?.classList.add('image-error'); }} /><span className="fallback-initials">{initials(book.name)}</span><span className="year-badge">{yearOf(book.name)}</span></div><div className="book-info"><p className="book-year">{yearOf(book.name)}</p><h2>{book.name}</h2><p className="book-id">ID · {book.id.slice(0, 8)}…</p></div></article>)}</section>}
    </main>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="modal" role="dialog" aria-modal="true" aria-label={selected.name} onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setSelected(null)} aria-label="Fechar"><X /></button><div className="modal-cover"><img src={selected.image} alt={`Capa: ${selected.name}`} /></div><div className="modal-details"><p className="eyebrow">DETALHES DA APOSTILA</p><h2>{selected.name}</h2><p className="modal-id">{selected.id}</p><a href={selected.image} target="_blank" rel="noreferrer">Abrir imagem original <ExternalLink size={15} /></a></div></div></div>}
  </div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
