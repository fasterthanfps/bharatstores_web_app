'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Plus,
    Trash2,
    Calendar,
    CheckSquare,
    MessageSquare,
    User,
    Bug,
    X,
    Check,
    Lock,
    LogOut,
    ArrowRight,
    Search,
    AlertTriangle,
    Eye,
    EyeOff
} from 'lucide-react';

const TEAM = [
    { id: 'akash', name: 'Akash', initials: 'AK', color: '#8B2020' },
    { id: 'anvith', name: 'Anvith', initials: 'AN', color: '#3b82c4' },
];

const COL_COLORS: Record<string, string> = {
    bug: '#C84B31',
    task: '#3b82c4',
};

const DEFAULT_COLUMNS = [
    { id: 'todo', title: 'To Do', color: '#3b82c4', wipLimit: 0, position: 0 },
    { id: 'inprogress', title: 'In Progress', color: '#d4850a', wipLimit: 0, position: 1 },
    { id: 'blocked', title: 'Blocked', color: '#c84b31', wipLimit: 0, position: 2 },
    { id: 'done', title: 'Done', color: '#2d9c6e', wipLimit: 0, position: 3 }
];

interface Column {
    id: string;
    title: string;
    color: string;
    wipLimit?: number;
    position: number;
}

interface Card {
    id: string;
    colId: string;
    type: 'bug' | 'feature' | 'idea' | 'update' | 'task';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description?: string;
    dueDate?: string;
    tags: string[];
    assignees: string[];
    comments: { author: string; text: string; createdAt?: string }[];
    checklist: { text: string; done: boolean }[];
    createdAt?: string;
    updatedAt?: string;
}

const LOCAL_STORAGE_STATE_KEY = 'bs-kanban-v1';
const LOCAL_STORAGE_AUTH_KEY = 'bs-kanban-auth-v1';

export default function DedicatedKanbanPage() {
    const supabase = createClient() as any;
    const [columns, setColumns] = useState<Column[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [currentUser, setCurrentUser] = useState<string>('Team Member');
    const [loading, setLoading] = useState(true);
    const [hasCloudSync, setHasCloudSync] = useState(false);

    // Auth Passcode Screen State
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [showPasscode, setShowPasscode] = useState(false);
    const [authName, setAuthName] = useState('akash');
    const [authError, setAuthError] = useState('');

    // Filters & UI State
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [myCardsOnly, setMyCardsOnly] = useState(false);
    const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'board' | 'analytics'>('board');
    const [dragOverColId, setDragOverColId] = useState<string | null>(null);
    const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
    const [lastDroppedCardId, setLastDroppedCardId] = useState<string | null>(null);

    // Modals
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [newCardOpen, setNewCardOpen] = useState(false);
    const [newCardColId, setNewCardColId] = useState<string>('todo');
    const [addColumnOpen, setAddColumnOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);

    // Form inputs
    const [ncTitle, setNcTitle] = useState('');
    const [ncDesc, setNcDesc] = useState('');
    const [ncType, setNcType] = useState<'bug' | 'feature' | 'idea' | 'update' | 'task'>('task');
    const [ncPriority, setNcPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [ncAssignee, setNcAssignee] = useState('');
    const [ncDue, setNcDue] = useState('');

    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [editCol, setEditCol] = useState('');
    const [editDue, setEditDue] = useState('');
    const [editType, setEditType] = useState<'bug' | 'task'>('task');
    const [newComment, setNewComment] = useState('');
    const [newCheckItem, setNewCheckItem] = useState('');

    const [newColName, setNewColName] = useState('');
    const [newColColor, setNewColColor] = useState('#3b82c4');

    const searchInputRef = useRef<HTMLInputElement>(null);

    // 1. Initial Authentication & Load Data
    useEffect(() => {
        const initBoard = async () => {
            setLoading(true);
            try {
                // Check if already authenticated via Supabase (e.g. as an admin)
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const userName = user.email?.split('@')[0] || 'Admin';
                    const matchedTeam = TEAM.find(t => t.id === userName.toLowerCase());
                    if (matchedTeam) {
                        setCurrentUser(matchedTeam.name);
                        setIsAuthorized(true);
                        setHasCloudSync(true);
                    } else {
                        try {
                            await supabase.auth.signOut();
                        } catch (e) {
                            console.error('Failed to sign out unauthorized Supabase session:', e);
                        }
                    }
                } else {
                    // Check local session authorization
                    const storedAuth = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
                    if (storedAuth) {
                        try {
                            const parsed = JSON.parse(storedAuth);
                            if (parsed.authorized && parsed.name) {
                                const matchedTeam = TEAM.find(t => t.id === parsed.name.toLowerCase());
                                if (matchedTeam) {
                                    setCurrentUser(matchedTeam.name);
                                    setIsAuthorized(true);
                                } else {
                                    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
                                }
                            }
                        } catch (e) {
                            console.error('Invalid auth token in local storage');
                        }
                    }
                }

                // Attempt to fetch columns & cards from Supabase
                const { data: colsData, error: colsErr } = await supabase
                    .from('kanban_columns')
                    .select('*')
                    .order('position', { ascending: true });

                const { data: cardsData, error: cardsErr } = await supabase
                    .from('kanban_cards')
                    .select('*');

                if (colsErr || cardsErr || !colsData) {
                    // Fail gracefully, load state from Local Storage
                    console.log('Using local storage backup for Kanban state.');
                    loadStateFromLocalStorage();
                    setHasCloudSync(false);
                } else {
                    let activeCols: Column[] = colsData.map((c: any) => ({
                        id: c.id,
                        title: c.title,
                        color: c.color,
                        wipLimit: c.wip_limit || 0,
                        position: c.position
                    }));

                    if (activeCols.length === 0) {
                        try {
                            const dbCols = DEFAULT_COLUMNS.map(c => ({
                                id: c.id,
                                title: c.title,
                                color: c.color,
                                wip_limit: c.wipLimit,
                                position: c.position
                            }));
                            const { error: seedErr } = await supabase
                                .from('kanban_columns')
                                .insert(dbCols);
                            if (!seedErr) {
                                activeCols = DEFAULT_COLUMNS;
                            }
                        } catch (seedErr) {
                            console.error('Failed to seed default columns to Supabase:', seedErr);
                        }
                    }

                    // Set columns
                    setColumns(activeCols.length > 0 ? activeCols : DEFAULT_COLUMNS);

                    // Set cards with properly formatted JSON data
                    const formattedCards: Card[] = (cardsData || []).map((c: any) => ({
                        id: c.id,
                        colId: c.col_id,
                        type: c.type as Card['type'],
                        priority: c.priority as Card['priority'],
                        title: c.title,
                        description: c.description || undefined,
                        dueDate: c.due_date || '',
                        tags: c.tags || [],
                        assignees: c.assignees || [],
                        comments: typeof c.comments === 'string' ? JSON.parse(c.comments) : (c.comments as any || []),
                        checklist: typeof c.checklist === 'string' ? JSON.parse(c.checklist) : (c.checklist as any || []),
                        createdAt: c.created_at,
                        updatedAt: c.updated_at,
                    }));
                    setCards(formattedCards);
                    setHasCloudSync(true);

                    // Cache in local storage too
                    localStorage.setItem(
                        LOCAL_STORAGE_STATE_KEY,
                        JSON.stringify({ columns: activeCols, cards: formattedCards })
                    );
                }
            } catch (err) {
                console.error('Error initializing Kanban:', err);
                loadStateFromLocalStorage();
            } finally {
                setLoading(false);
            }
        };

        initBoard();
    }, []);

    const loadStateFromLocalStorage = () => {
        const localData = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                setColumns(parsed.columns && parsed.columns.length > 0 ? parsed.columns : DEFAULT_COLUMNS);
                setCards(parsed.cards || []);
            } catch (e) {
                setColumns(DEFAULT_COLUMNS);
                setCards([]);
            }
        } else {
            // First time load - seed basic setup
            setColumns(DEFAULT_COLUMNS);
            setCards([]);
        }
    };

    // Helper to persist state to Local Storage
    const saveStateToLocalStorage = (nextCols: Column[], nextCards: Card[]) => {
        localStorage.setItem(
            LOCAL_STORAGE_STATE_KEY,
            JSON.stringify({ columns: nextCols, cards: nextCards })
        );
    };

    // 2. Keyboard Shortcuts Handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedCard(null);
                setNewCardOpen(false);
                setAddColumnOpen(false);
                setShortcutsOpen(false);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                setNewCardColId('todo');
                setNewCardOpen(true);
            }
            if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
                setShortcutsOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 3. Save / Sync Card helpers
    const saveCard = async (updatedCard: Card, currentCards: Card[]) => {
        const nextCards = currentCards.map(c => (c.id === updatedCard.id ? updatedCard : c));
        setCards(nextCards);
        saveStateToLocalStorage(columns, nextCards);

        if (hasCloudSync) {
            try {
                const dbPayload = {
                    id: updatedCard.id,
                    col_id: updatedCard.colId,
                    type: updatedCard.type,
                    priority: updatedCard.priority,
                    title: updatedCard.title,
                    description: updatedCard.description || null,
                    due_date: updatedCard.dueDate || null,
                    tags: updatedCard.tags,
                    assignees: updatedCard.assignees,
                    comments: updatedCard.comments,
                    checklist: updatedCard.checklist,
                    updated_at: new Date().toISOString(),
                };

                const { error } = await supabase
                    .from('kanban_cards')
                    .upsert(dbPayload);

                if (error) throw error;
            } catch (err) {
                console.error('Cloud Sync failed for card:', err);
            }
        }
    };

    // Handle authentication form submission
    const handleAuthSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const SECURE_PASSPHRASE = 'saffron-mango-cardamom-clove';
        if (passcode.trim() === SECURE_PASSPHRASE) {
            const matchedTeam = TEAM.find(t => t.id === authName);
            const displayUser = matchedTeam ? matchedTeam.name : 'Team Member';
            setCurrentUser(displayUser);
            setIsAuthorized(true);
            setAuthError('');
            localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify({ name: authName, authorized: true }));
        } else {
            setAuthError('Incorrect team passphrase. Please verify and try again.');
        }
    };

    const handleLogout = async () => {
        localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Failed to sign out from Supabase auth:', err);
        }
        setIsAuthorized(false);
        setPasscode('');
        setAuthName('akash');
        setCurrentUser('Team Member');
    };

    // Toggle Column Collapse
    const toggleCollapse = (colId: string) => {
        setCollapsedCols(prev => {
            const next = new Set(prev);
            if (next.has(colId)) next.delete(colId);
            else next.add(colId);
            return next;
        });
    };

    // Set WIP Limit
    const handleWipLimit = async (colId: string) => {
        const col = columns.find(c => c.id === colId);
        if (!col) return;
        const currentLimit = col.wipLimit || '';
        const limitStr = prompt(`Set WIP Limit for "${col.title}" (enter 0 or empty to remove):`, String(currentLimit));
        if (limitStr === null) return;
        const limit = parseInt(limitStr, 10) || 0;

        const nextColumns = columns.map(c => (c.id === colId ? { ...c, wipLimit: limit } : c));
        setColumns(nextColumns);
        saveStateToLocalStorage(nextColumns, cards);

        if (hasCloudSync) {
            try {
                const { error } = await supabase
                    .from('kanban_columns')
                    .update({ wip_limit: limit })
                    .eq('id', colId);
                if (error) throw error;
            } catch (err) {
                console.error('Failed to sync WIP limit to cloud:', err);
            }
        }
    };

    // Create New Card
    const handleCreateCard = async () => {
        if (!ncTitle.trim()) return;

        const newCard: Card = {
            id: 'c' + Date.now(),
            colId: newCardColId,
            type: ncType,
            priority: ncPriority,
            title: ncTitle.trim(),
            description: ncDesc.trim() || undefined,
            dueDate: ncDue || undefined,
            tags: [ncType, ncPriority === 'high' ? 'p1' : ncPriority === 'medium' ? 'p2' : 'p3'],
            assignees: ncAssignee ? [ncAssignee] : [],
            comments: [],
            checklist: [],
            createdAt: new Date().toISOString().slice(0, 10),
            updatedAt: new Date().toISOString().slice(0, 10),
        };

        const nextCards = [...cards, newCard];
        setCards(nextCards);
        saveStateToLocalStorage(columns, nextCards);

        if (hasCloudSync) {
            try {
                const dbPayload = {
                    id: newCard.id,
                    col_id: newCard.colId,
                    type: newCard.type,
                    priority: newCard.priority,
                    title: newCard.title,
                    description: newCard.description || null,
                    due_date: newCard.dueDate || null,
                    tags: newCard.tags,
                    assignees: newCard.assignees,
                    comments: newCard.comments,
                    checklist: newCard.checklist,
                };
                await supabase.from('kanban_cards').insert(dbPayload);
            } catch (e) {
                console.error('Cloud insert failed:', e);
            }
        }

        // Reset fields
        setNcTitle('');
        setNcDesc('');
        setNcType('task');
        setNcPriority('medium');
        setNcAssignee('');
        setNcDue('');
        setNewCardOpen(false);
    };

    // Card Drag and Drop Logic
    const handleDragStart = (e: React.DragEvent, cardId: string) => {
        e.dataTransfer.setData('text/plain', cardId);
        setDraggingCardId(cardId);
    };

    const handleDragEnd = () => {
        setDraggingCardId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetColId: string) => {
        e.preventDefault();
        setDragOverColId(null);
        setDraggingCardId(null);
        
        const cardId = e.dataTransfer.getData('text/plain');
        const card = cards.find(c => c.id === cardId);
        if (!card) return;
        if (card.colId === targetColId) return;

        const updatedCard = {
            ...card,
            colId: targetColId,
            updatedAt: new Date().toISOString().slice(0, 10)
        };

        setLastDroppedCardId(cardId);
        setTimeout(() => {
            setLastDroppedCardId(null);
        }, 800);

        await saveCard(updatedCard, cards);
    };

    // Open Card Detail
    const handleOpenDetail = (card: Card) => {
        setSelectedCard(card);
        setEditTitle(card.title);
        setEditDesc(card.description || '');
        setEditPriority(card.priority);
        setEditCol(card.colId);
        setEditDue(card.dueDate || '');
        setEditType(card.type === 'bug' ? 'bug' : 'task');
        setNewComment('');
        setNewCheckItem('');
    };

    // Save Card Changes
    const handleSaveDetail = async () => {
        if (!selectedCard) return;

        const updatedCard: Card = {
            ...selectedCard,
            title: editTitle.trim() || selectedCard.title,
            description: editDesc.trim() || undefined,
            priority: editPriority,
            colId: editCol,
            type: editType,
            dueDate: editDue || undefined,
            tags: [editType, editPriority === 'high' ? 'p1' : editPriority === 'medium' ? 'p2' : 'p3'],
            updatedAt: new Date().toISOString().slice(0, 10),
        };

        await saveCard(updatedCard, cards);
        setSelectedCard(null);
    };

    // Delete Card
    const handleDeleteCard = async (cardId: string) => {
        if (!confirm('Are you sure you want to delete this card?')) return;

        const nextCards = cards.filter(c => c.id !== cardId);
        setCards(nextCards);
        saveStateToLocalStorage(columns, nextCards);
        setSelectedCard(null);

        if (hasCloudSync) {
            try {
                await supabase
                    .from('kanban_cards')
                    .delete()
                    .eq('id', cardId);
            } catch (err) {
                console.error('Failed to delete card from cloud:', err);
            }
        }
    };

    // Add Comment
    const handleAddComment = async () => {
        if (!selectedCard || !newComment.trim()) return;

        const comment = {
            author: currentUser,
            text: newComment.trim(),
            createdAt: new Date().toLocaleDateString(),
        };

        const updatedCard = {
            ...selectedCard,
            comments: [...selectedCard.comments, comment],
        };

        setSelectedCard(updatedCard);
        await saveCard(updatedCard, cards);
        setNewComment('');
    };

    // Add Checklist Item
    const handleAddCheckItem = async () => {
        if (!selectedCard || !newCheckItem.trim()) return;

        const checkItem = {
            text: newCheckItem.trim(),
            done: false,
        };

        const updatedCard = {
            ...selectedCard,
            checklist: [...selectedCard.checklist, checkItem],
        };

        setSelectedCard(updatedCard);
        await saveCard(updatedCard, cards);
        setNewCheckItem('');
    };

    // Toggle Checklist Item State
    const handleToggleCheck = async (index: number, done: boolean) => {
        if (!selectedCard) return;

        const nextChecklist = [...selectedCard.checklist];
        nextChecklist[index].done = done;

        const updatedCard = {
            ...selectedCard,
            checklist: nextChecklist,
        };

        setSelectedCard(updatedCard);
        await saveCard(updatedCard, cards);
    };

    // Add Column
    const handleCreateColumn = async () => {
        if (!newColName.trim()) return;

        const newColId = newColName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        const newCol: Column = {
            id: newColId,
            title: newColName.trim(),
            color: newColColor,
            position: columns.length,
        };

        const nextColumns = [...columns, newCol];
        setColumns(nextColumns);
        saveStateToLocalStorage(nextColumns, cards);
        setAddColumnOpen(false);
        setNewColName('');

        if (hasCloudSync) {
            try {
                await supabase
                    .from('kanban_columns')
                    .insert({
                        id: newCol.id,
                        title: newCol.title,
                        color: newCol.color,
                        position: newCol.position,
                    });
            } catch (err) {
                console.error('Failed to create cloud column:', err);
            }
        }
    };

    // Export Board
    const handleExportJSON = () => {
        const data = JSON.stringify({ columns, cards }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bharatstores-kanban-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Filter card lists
    const getVisibleCards = () => {
        return cards.filter(c => {
            if (activeFilter !== 'all' && c.type !== activeFilter) return false;
            if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(c.description || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (myCardsOnly) {
                const myId = TEAM.find(m => m.name.toLowerCase() === currentUser.toLowerCase() || m.id === currentUser.toLowerCase())?.id || currentUser.toLowerCase();
                if (!c.assignees.includes(myId)) return false;
            }
            return true;
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-masala-bg text-masala-text">
                <div className="h-10 w-10 animate-spin rounded-full border-3 border-masala-accent border-t-transparent"></div>
                <p className="text-xs font-bold uppercase tracking-wider text-masala-text-muted">Loading Team Workspace...</p>
            </div>
        );
    }

    // Passcode Gate Page
    if (!isAuthorized) {
        return (
            <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden hero-bg-gradient py-12">
                <div className="absolute inset-0 hero-dot-grid opacity-60"></div>
                <div className="hero-orb hero-orb--primary"></div>
                <div className="hero-orb hero-orb--accent"></div>

                <div className="relative w-full max-w-[420px] rounded-3xl bg-white border border-masala-border/80 p-8 md:p-10 shadow-xl shadow-masala-primary/5 animate-scale-in text-center">
                    {/* Logo & Header */}
                    <div className="mb-8">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-masala-primary/5 flex items-center justify-center text-masala-primary mb-4 font-black text-xl border border-masala-primary/10">
                            🚩
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-masala-text font-display mb-2">
                            Team Workspace
                        </h1>
                        <p className="text-xs text-masala-text-muted font-medium">
                            Enter the BharatStores Kanban board to coordinate engineering sprints and scrapers.
                        </p>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-5 text-left">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5 pl-1">
                                Identify Yourself
                            </label>
                            <select
                                value={authName}
                                onChange={(e) => setAuthName(e.target.value)}
                                className="w-full rounded-2xl bg-masala-bg border border-masala-border/80 px-4 py-3 text-xs font-semibold text-masala-text outline-none focus:border-masala-accent focus:bg-white transition-all shadow-sm"
                            >
                                {TEAM.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5 pl-1">
                                Team Passphrase
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasscode ? "text" : "password"}
                                    placeholder="Enter team passphrase..."
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    className="w-full rounded-2xl bg-masala-bg border border-masala-border/80 px-4 py-3 text-xs text-masala-text outline-none focus:border-masala-accent focus:bg-white transition-all shadow-sm pl-10 pr-10"
                                    required
                                />
                                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-masala-text-light" />
                                <button
                                    type="button"
                                    onClick={() => setShowPasscode(!showPasscode)}
                                    className="absolute right-3.5 top-3.5 text-masala-text-light hover:text-masala-text transition cursor-pointer"
                                    title={showPasscode ? "Hide Passphrase" : "Show Passphrase"}
                                >
                                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {authError && (
                            <div className="rounded-xl bg-red-50 border border-red-200/50 p-3.5 text-center text-xs font-semibold text-red-700 animate-fade-up">
                                {authError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-masala-primary py-3.5 text-xs font-bold text-white hover:bg-masala-secondary shadow-lg shadow-masala-primary/10 active:scale-[0.98] transition-all cursor-pointer mt-2"
                        >
                            Enter Workspace <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>
                <div className="mt-8 text-[10px] text-masala-text-light font-bold uppercase tracking-widest pointer-events-none">
                    BharatStores Core System • 2026
                </div>
            </div>
        );
    }

    const visibleCards = getVisibleCards();

    return (
        <div className="min-h-screen flex flex-col bg-masala-bg/25">
            {/* Elegant Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-masala-border/50 px-4 md:px-8 py-3.5 flex items-center justify-between max-w-[1600px] mx-auto w-full">
                <div className="flex items-center gap-3">
                    <div>
                        <div className="text-sm font-black uppercase tracking-tight text-masala-text leading-none flex items-center gap-1.5" role="heading" aria-level={1}>
                            BharatStores <span className="font-display lowercase italic font-normal text-xs text-masala-accent">flow</span>
                        </div>
                        <p className="text-[10px] text-masala-text-light font-bold uppercase tracking-wider mt-0.5">Team Workspace</p>
                    </div>
                </div>

                {/* Top Right Utilities */}
                <div className="flex items-center gap-3">
                    {/* Cloud Sync Status */}
                    <div className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 bg-masala-muted/30 border border-masala-border/60 text-[10px] font-bold text-masala-text-muted">
                        <span className={`w-2 h-2 rounded-full ${hasCloudSync ? 'bg-green-600 animate-pulse' : 'bg-orange-500'}`}></span>
                        {hasCloudSync ? 'Cloud Synced' : 'Offline Mode'}
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-masala-muted p-1 border border-masala-border/40 pl-3">
                        <span className="text-[10px] font-bold text-masala-text-muted pr-1">
                            {currentUser}
                        </span>
                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Log Out"
                            className="rounded-full bg-white p-1.5 text-masala-text-light hover:text-masala-primary hover:shadow-sm transition-all cursor-pointer flex items-center justify-center"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Dashboard Wrapper */}
            <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col">
                
                {/* Stats Bar */}
                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className="rounded-2xl bg-white border border-masala-border/40 p-3 md:p-4 shadow-sm flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-masala-muted/40 text-masala-primary flex items-center justify-center text-xs md:text-sm">🗂️</div>
                        <div>
                            <h5 className="text-[9px] font-bold uppercase tracking-wider text-masala-text-light truncate">Total Tasks</h5>
                            <p className="text-lg md:text-xl font-extrabold text-masala-text">{cards.length}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white border border-masala-border/40 p-3 md:p-4 shadow-sm flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center text-xs md:text-sm">✅</div>
                        <div>
                            <h5 className="text-[9px] font-bold uppercase tracking-wider text-masala-text-light truncate">Completed</h5>
                            <p className="text-lg md:text-xl font-extrabold text-green-700">
                                {cards.filter(c => c.colId === 'done').length}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white border border-masala-border/40 p-3 md:p-4 shadow-sm flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center text-xs md:text-sm">⚠️</div>
                        <div>
                            <h5 className="text-[9px] font-bold uppercase tracking-wider text-masala-text-light truncate">Active Issues</h5>
                            <p className="text-lg md:text-xl font-extrabold text-red-700">
                                {cards.filter(c => c.type === 'bug' && c.colId !== 'done').length}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white border border-masala-border/40 p-3 md:p-4 shadow-sm flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xs md:text-sm">⚡</div>
                        <div>
                            <h5 className="text-[9px] font-bold uppercase tracking-wider text-masala-text-light truncate">Done Rate</h5>
                            <p className="text-lg md:text-xl font-extrabold text-purple-700">
                                {cards.length > 0 ? Math.round((cards.filter(c => c.colId === 'done').length / cards.length) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Filter Chips - Horizontal Scroll on Mobile */}
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full md:w-auto -mx-4 px-4 md:mx-0 md:px-0">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all border ${
                                activeFilter === 'all'
                                    ? 'bg-masala-primary text-white border-masala-primary shadow-sm'
                                    : 'text-masala-text-muted border-masala-border/60 bg-white hover:bg-masala-muted/30'
                            }`}
                        >
                            All Tasks & Issues
                        </button>
                        {[
                            { type: 'task', label: 'Tasks Only', icon: CheckSquare },
                            { type: 'bug', label: 'Issues Only', icon: Bug },
                        ].map(f => {
                            const Icon = f.icon;
                            return (
                                <button
                                    key={f.type}
                                    onClick={() => setActiveFilter(f.type)}
                                    className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all border ${
                                        activeFilter === f.type
                                            ? 'bg-masala-primary text-white border-masala-primary shadow-sm'
                                            : 'text-masala-text-muted border-masala-border/60 bg-white hover:bg-masala-muted/30'
                                    }`}
                                >
                                    <Icon className="h-3 w-3" />
                                    {f.label}
                                </button>
                            );
                        })}
                        <div className="flex-shrink-0 w-[1px] h-6 bg-masala-border/60 self-center mx-1"></div>
                        <button
                            onClick={() => setMyCardsOnly(!myCardsOnly)}
                            className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all border ${
                                myCardsOnly
                                    ? 'bg-masala-accent/10 text-masala-accent border-masala-accent/30 shadow-sm'
                                    : 'text-masala-text-muted border-masala-border/60 bg-white hover:bg-masala-muted/30'
                            }`}
                        >
                            <User className="h-3 w-3" />
                            Assigned to Me
                        </button>
                    </div>

                    {/* Search and Action Toolbar */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-initial">
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-48 rounded-full bg-white border border-masala-border/80 px-4 py-2 pl-9 text-xs text-masala-text outline-none focus:border-masala-accent md:focus:w-60 transition-all placeholder-masala-text-light shadow-sm"
                            />
                            <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-masala-text-light" />
                        </div>

                        <button
                            onClick={() => {
                                setNewCardColId('todo');
                                setNewCardOpen(true);
                            }}
                            className="flex-shrink-0 flex items-center justify-center gap-1.5 rounded-full bg-masala-accent px-5 py-2 text-xs font-extrabold text-white hover:bg-masala-secondary shadow-md active:translate-y-0.5 transition-all cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Task
                        </button>
                    </div>
                </div>

                {/* Board View */}
                <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-masala-border scrollbar-track-transparent select-none">
                        {columns.map(col => {
                            const colCards = visibleCards.filter(c => c.colId === col.id);
                            const allColCards = cards.filter(c => c.colId === col.id);
                            const isDragOver = dragOverColId === col.id;

                            return (
                                <div
                                    key={col.id}
                                    className={`flex w-[290px] md:w-[340px] shrink-0 flex-col rounded-2xl border transition-all duration-200 p-4 md:p-5 shadow-sm min-h-[550px] ${
                                        isDragOver 
                                            ? 'bg-masala-accent/5 border-masala-accent/30 border-dashed translate-y-[-2px]' 
                                            : 'bg-white border-masala-border/40'
                                    }`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (dragOverColId !== col.id) setDragOverColId(col.id);
                                    }}
                                    onDragLeave={() => setDragOverColId(null)}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                >
                                    {/* Column Header */}
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-3 w-3 rounded-full border border-white shadow-sm"
                                                style={{ backgroundColor: col.color }}
                                            ></div>
                                            <h3 className="text-xs font-black uppercase tracking-wider text-masala-text">
                                                {col.title}
                                            </h3>
                                            <span className="rounded-full bg-masala-muted px-2 py-0.5 text-[9px] font-extrabold text-masala-text-muted">
                                                {allColCards.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    setNewCardColId(col.id);
                                                    setNewCardOpen(true);
                                                }}
                                                className="rounded-full p-1.5 hover:bg-masala-muted text-masala-text-light hover:text-masala-text transition animate-none cursor-pointer"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Column Cards Container */}
                                    <div className="flex flex-1 flex-col gap-4">
                                        {colCards.length === 0 ? (
                                            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-masala-border/60 p-8 text-center text-[10px] text-masala-text-light font-medium bg-masala-muted/10">
                                                No tasks here
                                            </div>
                                        ) : (
                                            colCards.map(card => {
                                                const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && col.id !== 'done';
                                                const isChecklistDone = card.checklist && card.checklist.length > 0 && card.checklist.every(item => item.done);
                                                const assigneesList = card.assignees.map(a => TEAM.find(m => m.id === a)).filter(Boolean);
                                                const isDragging = draggingCardId === card.id;
                                                const isRecentlyDropped = lastDroppedCardId === card.id;

                                                return (
                                                    <div
                                                        key={card.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, card.id)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={() => handleOpenDetail(card)}
                                                        className={`group relative cursor-grab rounded-2xl bg-white border border-masala-border/50 p-5 hover:border-masala-accent/40 hover:shadow-lg transition-all duration-300 active:cursor-grabbing hover:scale-[1.01] ${
                                                            isOverdue ? 'border-red-300 bg-red-50/5' : ''
                                                        } ${
                                                            isDragging ? 'opacity-25 scale-[0.98] border-dashed border-masala-accent/80 bg-masala-muted/20 shadow-none' : ''
                                                        } ${
                                                            isRecentlyDropped ? 'animate-bounce-subtle border-masala-accent shadow-[0_0_15px_rgba(200,75,49,0.25)] bg-masala-accent/5' : ''
                                                        }`}
                                                    >
                                                        {/* Top indicator category strip */}
                                                        <div className="mb-3.5 flex items-center justify-between">
                                                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                                                                card.type === 'bug' 
                                                                    ? 'bg-red-50 text-red-700 border-red-200/40' 
                                                                    : 'bg-blue-50 text-blue-700 border-blue-200/40'
                                                            }`}>
                                                                {card.type === 'bug' ? '⚠️ Issue' : '📌 Task'}
                                                            </span>

                                                            {/* Priority Dot */}
                                                            <div className="flex items-center gap-1">
                                                                <span className={`w-2 h-2 rounded-full ${
                                                                    card.priority === 'high' ? 'bg-red-600' : card.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                                                                }`}></span>
                                                                <span className="text-[9px] font-bold text-masala-text-light uppercase tracking-wider">
                                                                    {card.priority}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Title */}
                                                        <h4 className="mb-1.5 text-[13px] font-bold tracking-tight text-masala-text line-clamp-2 leading-relaxed">
                                                            {card.title}
                                                        </h4>

                                                        {/* Description */}
                                                        {card.description && (
                                                            <p className="mb-4 text-xs text-masala-text-muted/90 line-clamp-2 leading-relaxed">
                                                                {card.description}
                                                            </p>
                                                        )}

                                                        {/* Footer Separator */}
                                                        <div className="w-full h-[1px] bg-masala-border/40 mb-3.5"></div>

                                                        {/* Metadata Row */}
                                                        <div className="flex items-center justify-between text-[10px] text-masala-text-light font-bold">
                                                            <div className="flex items-center gap-3">
                                                                {card.dueDate && (
                                                                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-masala-text-muted'}`}>
                                                                        <Calendar className="h-3 w-3" />
                                                                        {card.dueDate.split('-').slice(1).join('/')}
                                                                    </span>
                                                                )}
                                                                {card.checklist && card.checklist.length > 0 && (
                                                                    <span className={`flex items-center gap-1 ${isChecklistDone ? 'text-green-700' : 'text-masala-text-muted'}`}>
                                                                        <CheckSquare className="h-3 w-3" />
                                                                        {card.checklist.filter(i => i.done).length}/{card.checklist.length}
                                                                    </span>
                                                                )}
                                                                {card.comments && card.comments.length > 0 && (
                                                                    <span className="flex items-center gap-1 text-masala-text-muted">
                                                                        <MessageSquare className="h-3 w-3" />
                                                                        {card.comments.length}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Quick Move Action & Assignee Avatars */}
                                                            <div className="flex items-center gap-2">
                                                                {col.id !== 'done' && (
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            const nextColMap: Record<string, string> = {
                                                                                todo: 'inprogress',
                                                                                inprogress: 'done',
                                                                                blocked: 'inprogress'
                                                                            };
                                                                            const nextColId = nextColMap[col.id] || 'done';
                                                                            const updatedCard = {
                                                                                ...card,
                                                                                colId: nextColId,
                                                                                updatedAt: new Date().toISOString().slice(0, 10)
                                                                            };
                                                                            await saveCard(updatedCard, cards);
                                                                        }}
                                                                        className="rounded bg-masala-muted hover:bg-masala-accent hover:text-white px-2 py-0.5 text-[9px] font-extrabold text-masala-text-muted transition cursor-pointer"
                                                                    >
                                                                        {col.id === 'todo' ? 'Start ⚡' : col.id === 'inprogress' ? 'Finish ✅' : 'Unblock ⚡'}
                                                                    </button>
                                                                )}

                                                                {assigneesList.length > 0 && (
                                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                                        {assigneesList.map((m: any) => (
                                                                            <div 
                                                                                key={m.id}
                                                                                title={m.name}
                                                                                className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[9px] font-black text-white shadow-sm"
                                                                                style={{ backgroundColor: m.color }}
                                                                            >
                                                                                {m.initials}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}

                                        {isDragOver && (
                                            <div className="rounded-2xl border-2 border-dashed border-masala-accent/60 bg-masala-accent/5 h-24 flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-masala-accent/80 animate-pulse-drop-indicator">
                                                Drop here 🎯
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
            </main>

            {/* Modal: New Card */}
            {newCardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-masala-text/30 backdrop-blur-sm p-4 animate-scale-in">
                    <div className="w-full max-w-lg rounded-3xl bg-white border border-masala-border/60 p-6 md:p-8 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-wider text-masala-text">Create Task</h3>
                            <button onClick={() => setNewCardOpen(false)} className="text-masala-text-light hover:text-masala-text transition p-1 rounded-full hover:bg-masala-muted/30">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Card Title</label>
                                <input
                                    type="text"
                                    placeholder="What needs to be done?"
                                    value={ncTitle}
                                    onChange={(e) => setNcTitle(e.target.value)}
                                    className="w-full rounded-xl bg-masala-bg border border-masala-border/80 px-4 py-2.5 text-xs text-masala-text font-bold outline-none focus:border-masala-accent focus:bg-white shadow-sm transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Description</label>
                                <textarea
                                    placeholder="Provide detailed description..."
                                    rows={3}
                                    value={ncDesc}
                                    onChange={(e) => setNcDesc(e.target.value)}
                                    className="w-full rounded-xl bg-masala-bg border border-masala-border/80 px-4 py-2.5 text-xs text-masala-text outline-none focus:border-masala-accent focus:bg-white shadow-sm transition-all resize-none leading-relaxed"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Type</label>
                                    <select
                                        value={ncType}
                                        onChange={(e) => setNcType(e.target.value as any)}
                                        className="w-full rounded-xl bg-masala-bg border border-masala-border/80 px-4 py-2.5 text-xs font-bold text-masala-text outline-none focus:border-masala-accent shadow-sm"
                                    >
                                        <option value="task">📌 Task</option>
                                        <option value="bug">⚠️ Issue</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Priority</label>
                                    <select
                                        value={ncPriority}
                                        onChange={(e) => setNcPriority(e.target.value as any)}
                                        className="w-full rounded-xl bg-masala-bg border border-masala-border/80 px-4 py-2.5 text-xs font-bold text-masala-text outline-none focus:border-masala-accent shadow-sm"
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Assignee</label>
                                    <select
                                        value={ncAssignee}
                                        onChange={(e) => setNcAssignee(e.target.value)}
                                        className="w-full rounded-xl bg-masala-bg border border-masala-border/80 px-4 py-2.5 text-xs font-bold text-masala-text outline-none focus:border-masala-accent shadow-sm"
                                    >
                                        <option value="">Unassigned</option>
                                        {TEAM.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Due Date</label>
                                    <input
                                        type="date"
                                        value={ncDue}
                                        onChange={(e) => setNcDue(e.target.value)}
                                        className="w-full rounded-xl bg-masala-bg border border-masala-border/80 px-4 py-2.5 text-xs font-bold text-masala-text outline-none focus:border-masala-accent shadow-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setNewCardOpen(false)}
                                    className="rounded-full bg-masala-muted hover:bg-masala-pill px-4 py-2 text-xs font-bold text-masala-text-muted hover:text-masala-text transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateCard}
                                    className="rounded-full bg-masala-accent px-5 py-2 text-xs font-extrabold text-white hover:bg-masala-secondary shadow-md transition cursor-pointer"
                                >
                                    Create Card
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Card Detail / Edit */}
            {selectedCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-masala-text/30 backdrop-blur-sm p-4 overflow-y-auto animate-scale-in">
                    <div className="w-full max-w-2xl rounded-3xl bg-white border border-masala-border/60 shadow-2xl overflow-hidden">
                        {/* Detail Header */}
                        <div className="flex items-center justify-between border-b border-masala-border/40 px-6 py-4 bg-masala-bg">
                            <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                                    selectedCard.type === 'bug' ? 'bg-red-50 text-red-700 border-red-200/50' : 'bg-blue-50 text-blue-700 border-blue-200/50'
                                }`}>
                                    {selectedCard.type === 'bug' ? '⚠️ Issue' : '📌 Task'}
                                </span>
                                <span className="text-[10px] text-masala-text-light font-bold">#{selectedCard.id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDeleteCard(selectedCard.id)}
                                    className="flex items-center gap-1 rounded-full bg-red-50 border border-red-200/60 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100/80 transition"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                                <button onClick={() => setSelectedCard(null)} className="text-masala-text-light hover:text-masala-text transition p-1.5 rounded-full hover:bg-masala-muted/30">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Detail Body */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                            {/* Main Body (Left Side) */}
                            <div className="md:col-span-2 space-y-5">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Title</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full rounded-xl bg-masala-bg border border-masala-border px-4 py-2.5 text-xs font-bold text-masala-text outline-none focus:border-masala-accent focus:bg-white transition-all shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Description</label>
                                    <textarea
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        rows={4}
                                        className="w-full rounded-xl bg-masala-bg border border-masala-border px-4 py-2.5 text-xs text-masala-text outline-none focus:border-masala-accent focus:bg-white transition-all shadow-sm resize-none leading-relaxed"
                                    />
                                </div>

                                {/* Checklist Sub-section */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-2">Subtasks / Checklist</label>
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                        {(selectedCard.checklist || []).length === 0 ? (
                                            <p className="text-xs text-masala-text-light italic">No subtasks defined.</p>
                                        ) : (
                                            selectedCard.checklist.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2.5 rounded-xl bg-masala-bg/40 border border-masala-border/40 px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.done}
                                                        onChange={(e) => handleToggleCheck(idx, e.target.checked)}
                                                        className="h-4 w-4 rounded border-masala-border bg-white text-masala-accent focus:ring-0 cursor-pointer"
                                                    />
                                                    <span className={`text-xs text-masala-text ${item.done ? 'line-through text-masala-text-light' : 'font-bold'}`}>
                                                        {item.text}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add subtask..."
                                            value={newCheckItem}
                                            onChange={(e) => setNewCheckItem(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCheckItem()}
                                            className="flex-1 rounded-xl bg-masala-bg border border-masala-border px-3.5 py-2 text-xs text-masala-text outline-none focus:border-masala-accent"
                                        />
                                        <button
                                            onClick={handleAddCheckItem}
                                            className="rounded-xl bg-masala-pill border border-masala-border hover:bg-masala-muted px-4 py-2 text-xs font-bold text-masala-text transition"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-masala-text-light mb-2">Comments ({selectedCard.comments.length})</label>
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                        {selectedCard.comments.length === 0 ? (
                                            <p className="text-xs text-masala-text-light italic">No comments yet. Start the conversation!</p>
                                        ) : (
                                            selectedCard.comments.map((comment, idx) => (
                                                <div key={idx} className="rounded-2xl bg-masala-bg/40 border border-masala-border/40 p-3.5 text-xs">
                                                    <div className="mb-1 flex items-center justify-between font-extrabold text-masala-accent text-[9px] uppercase tracking-wider">
                                                        <span>{comment.author}</span>
                                                        <span className="text-masala-text-light font-bold normal-case">{comment.createdAt}</span>
                                                    </div>
                                                    <p className="text-masala-text leading-relaxed font-bold">{comment.text}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Write a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                            className="flex-1 rounded-xl bg-masala-bg border border-masala-border px-3.5 py-2 text-xs text-masala-text outline-none focus:border-masala-accent"
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            className="rounded-xl bg-masala-accent hover:bg-masala-secondary px-4 py-2 text-xs font-extrabold text-white transition shadow-sm"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar / Meta Settings (Right Side) */}
                            <div className="rounded-2xl bg-masala-bg border border-masala-border p-5 space-y-4 h-fit shadow-sm">
                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Column / Status</label>
                                    <select
                                        value={editCol}
                                        onChange={(e) => setEditCol(e.target.value)}
                                        className="w-full rounded-xl bg-white border border-masala-border px-3 py-2 text-xs text-masala-text outline-none focus:border-masala-accent font-bold"
                                    >
                                        {columns.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Type</label>
                                    <select
                                        value={editType}
                                        onChange={(e) => setEditType(e.target.value as any)}
                                        className="w-full rounded-xl bg-white border border-masala-border px-3 py-2 text-xs text-masala-text outline-none focus:border-masala-accent font-bold"
                                    >
                                        <option value="task">📌 Task</option>
                                        <option value="bug">⚠️ Issue</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Priority</label>
                                    <select
                                        value={editPriority}
                                        onChange={(e) => setEditPriority(e.target.value as any)}
                                        className="w-full rounded-xl bg-white border border-masala-border px-3 py-2 text-xs text-masala-text outline-none focus:border-masala-accent font-bold"
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-bold uppercase tracking-wider text-masala-text-light mb-1.5">Due Date</label>
                                    <input
                                        type="date"
                                        value={editDue}
                                        onChange={(e) => setEditDue(e.target.value)}
                                        className="w-full rounded-xl bg-white border border-masala-border px-3 py-2 text-xs font-bold text-masala-text outline-none focus:border-masala-accent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Detail Footer */}
                        <div className="flex justify-end gap-2.5 border-t border-masala-border/40 px-6 py-4 bg-masala-bg">
                            <button
                                onClick={() => setSelectedCard(null)}
                                className="rounded-full bg-masala-muted hover:bg-masala-pill px-4 py-2 text-xs font-bold text-masala-text-muted hover:text-masala-text transition"
                            >
                                Close Without Saving
                            </button>
                            <button
                                onClick={handleSaveDetail}
                                className="rounded-full bg-masala-accent px-5 py-2 text-xs font-extrabold text-white hover:bg-masala-secondary transition shadow-sm cursor-pointer"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Shortcuts Sheet */}
            {shortcutsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-masala-text/30 backdrop-blur-sm p-4 animate-scale-in">
                    <div className="w-full max-w-sm rounded-3xl bg-white border border-masala-border/60 p-6 shadow-2xl text-center">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-wider text-masala-text">Hotkeys</h3>
                            <button onClick={() => setShortcutsOpen(false)} className="text-masala-text-light hover:text-masala-text transition p-1 rounded-full hover:bg-masala-muted/30">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-3.5 text-left">
                            {[
                                { name: 'Create Task', shortcut: 'Ctrl + N' },
                                { name: 'Search focus', shortcut: 'Ctrl + K' },
                                { name: 'Close overlay', shortcut: 'Esc' },
                                { name: 'Toggle help', shortcut: '?' },
                                { name: 'Right-click Column', shortcut: 'Collapse toggle' },
                            ].map(s => (
                                <div key={s.name} className="flex justify-between items-center text-xs text-masala-text-muted border-b border-masala-border/30 pb-2.5">
                                    <span className="font-bold">{s.name}</span>
                                    <kbd className="rounded bg-masala-muted border border-masala-border/60 px-2 py-0.5 font-mono text-[10px] text-masala-text font-black">
                                        {s.shortcut}
                                    </kbd>
                                </div>
                            ))}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setShortcutsOpen(false)}
                                    className="rounded-full bg-masala-muted hover:bg-masala-pill px-4 py-2 text-xs font-bold text-masala-text-muted hover:text-masala-text transition cursor-pointer"
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
