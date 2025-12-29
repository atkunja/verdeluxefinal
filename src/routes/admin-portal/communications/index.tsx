import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";
import { AdminShell } from "~/components/admin/AdminShell";
import { Phone, RefreshCw, User, Image, Download, MessageSquare, Send, Search, Edit2, Trash2, X, Check } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { ActionConfirmationModal } from "~/components/admin/ActionConfirmationModal";
import { useAuthStore } from "~/stores/authStore";

export const Route = createFileRoute("/admin-portal/communications/")({
    component: CommunicationsPage,
});

function CommunicationsPage() {
    const { user } = useAuthStore();
    const trpc = useTRPC();
    const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
    const [messageText, setMessageText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const usersQuery = useQuery(trpc.getAllUsersAdmin.queryOptions({}));
    const messagesQuery = useQuery(trpc.messaging.getMessages.queryOptions({}));
    const callsQuery = useQuery(trpc.messaging.getCalls.queryOptions({}));

    const sendMessageMutation = useMutation(
        trpc.messaging.sendMessage.mutationOptions({
            onSuccess: () => {
                messagesQuery.refetch();
                setMessageText("");
                toast.success("Message sent");
            },
            onError: (err: any) => {
                toast.error(`Failed to send: ${err.message}`);
            }
        })
    );

    const syncMessagesMutation = useMutation(
        trpc.messaging.syncMessages.mutationOptions({
            onSuccess: (data) => {
                messagesQuery.refetch();
                toast.success(`Synced ${data.count} messages`);
            }
        })
    );

    const syncCallsMutation = useMutation(
        trpc.messaging.syncCalls.mutationOptions({
            onSuccess: (data) => {
                callsQuery.refetch();
                toast.success(`Synced ${data.count} calls`);
            }
        })
    );

    const renameContactMutation = useMutation(
        trpc.messaging.renameContact.mutationOptions({
            onSuccess: () => {
                usersQuery.refetch();
                setIsEditingName(false);
                toast.success("Contact renamed");
            }
        })
    );

    const deleteConversationMutation = useMutation(
        trpc.messaging.deleteConversation.mutationOptions({
            onSuccess: () => {
                messagesQuery.refetch();
                callsQuery.refetch();
                setSelectedContactId(null);
                toast.success("Conversation deleted");
            }
        })
    );

    const markConversationReadMutation = useMutation(
        trpc.messaging.markConversationRead.mutationOptions({
            onSuccess: () => {
                messagesQuery.refetch();
            }
        })
    );

    const makeCallMutation = useMutation(
        trpc.makeCall.mutationOptions({
            onSuccess: (data) => {
                toast.success(data.note || "Call initiated");
                callsQuery.refetch();
            },
            onError: (err: any) => {
                toast.error(`Call failed: ${err.message}`);
            }
        })
    );

    const handleSyncAll = async () => {
        await Promise.all([
            syncMessagesMutation.mutateAsync(),
            syncCallsMutation.mutateAsync()
        ]);
    };

    // Auto-sync messages and calls when page loads
    useEffect(() => {
        // Only sync if mutations are not already pending
        if (!syncMessagesMutation.isPending && !syncCallsMutation.isPending) {
            syncMessagesMutation.mutate();
            syncCallsMutation.mutate();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const [activeTab, setActiveTab] = useState<'clients' | 'employees'>('clients');

    // Group items by contact
    const segmentedConversations = useMemo(() => {
        if (!usersQuery.data?.users) return { clients: [], employees: [] };

        const all = usersQuery.data.users
            .filter(u => u.phone && u.id !== user?.id)
            .map(contactUser => {
                const userMessages = (messagesQuery.data || []) as any[];
                const filteredMessages = userMessages.filter(
                    m => m.senderId === contactUser.id || m.recipientId === contactUser.id
                ).map(m => ({ ...m, type: 'message' as const }));

                const userCalls = (callsQuery.data || []) as any[];
                const filteredCalls = userCalls.filter(
                    c => c.contactId === contactUser.id
                ).map(c => ({ ...c, type: 'call' as const }));

                const allItems = [...filteredMessages, ...filteredCalls].sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );

                const unreadCount = filteredMessages.filter(m => m.recipientId === user?.id && !m.isRead).length;

                return {
                    user: contactUser,
                    lastItem: allItems[allItems.length - 1],
                    items: allItems,
                    unreadCount
                };
            })
            .filter(conv => {
                const hasHistory = conv.items.length > 0 || conv.user.role === 'CLIENT' || conv.user.role === 'CLEANER';
                if (!hasHistory) return false;

                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                const fullName = `${conv.user.firstName} ${conv.user.lastName}`.toLowerCase();
                const phone = (conv.user.phone || "").toLowerCase();
                return fullName.includes(q) || phone.includes(q);
            })
            .sort((a, b) => {
                const dateA = a.lastItem ? new Date(a.lastItem.createdAt).getTime() : 0;
                const dateB = b.lastItem ? new Date(b.lastItem.createdAt).getTime() : 0;
                return dateB - dateA;
            });

        return {
            clients: all.filter(c => c.user.role === 'CLIENT' || c.user.email.includes('@guest')),
            employees: all.filter(c => c.user.role === 'CLEANER' || c.user.role === 'ADMIN' || c.user.role === 'OWNER')
        };
    }, [usersQuery.data, messagesQuery.data, callsQuery.data, searchQuery, user?.id]);

    const allConversations = [...segmentedConversations.clients, ...segmentedConversations.employees];
    const selectedConversation = allConversations.find(c => c.user.id === selectedContactId);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContactId || !messageText.trim()) return;

        sendMessageMutation.mutate({
            recipientId: selectedContactId,
            content: messageText
        });
    };

    const handleStartEdit = () => {
        if (!selectedConversation) return;
        setEditFirstName(selectedConversation.user.firstName || "");
        setEditLastName(selectedConversation.user.lastName || "");
        setIsEditingName(true);
    };

    const handleSaveName = () => {
        if (!selectedContactId) return;
        renameContactMutation.mutate({
            contactId: selectedContactId,
            firstName: editFirstName,
            lastName: editLastName
        });
    };

    const handleDeleteConversation = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteConversation = async () => {
        if (!selectedContactId) return;
        await deleteConversationMutation.mutateAsync({ contactId: selectedContactId });
    };

    const activeConversationItems = selectedConversation?.items || [];
    const currentList = activeTab === 'clients' ? segmentedConversations.clients : segmentedConversations.employees;

    return (
        <AdminShell title="Communications" subtitle="SMS & Calls via OpenPhone">
            <div className="flex h-[calc(100vh-220px)] gap-6 rounded-[32px] border border-white/40 bg-white/40 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl">

                {/* Contact List */}
                <div className="flex w-85 flex-col border-r border-gray-100 pr-4">
                    <div className="mb-4 flex items-center justify-between px-2">
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Messages</h3>
                        <button
                            onClick={handleSyncAll}
                            disabled={syncMessagesMutation.isPending || syncCallsMutation.isPending}
                            className="p-2.5 hover:bg-white/80 rounded-2xl text-gray-500 transition-all hover:shadow-sm"
                            title="Sync All from OpenPhone"
                        >
                            <RefreshCw className={`w-4 h-4 ${(syncMessagesMutation.isPending || syncCallsMutation.isPending) ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="px-2 mb-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search contacts..."
                                className="w-full pl-9 pr-4 py-2 bg-white/50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-3 h-3 text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-50/50 rounded-2xl mb-4 mx-2">
                        <button
                            onClick={() => setActiveTab('clients')}
                            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'clients'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Clients
                        </button>
                        <button
                            onClick={() => setActiveTab('employees')}
                            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'employees'
                                ? 'bg-white text-emerald-600 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Employees
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                        {usersQuery.isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                                <span className="text-xs text-gray-400 font-medium">Loading inbox...</span>
                            </div>
                        ) : currentList.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-xs">
                                {searchQuery ? "No contacts found matching your search" : `No ${activeTab} yet`}
                            </div>
                        ) :
                            currentList.map(conv => (
                                <div
                                    key={conv.user.id}
                                    onClick={() => {
                                        setSelectedContactId(conv.user.id);
                                        if (conv.unreadCount > 0) {
                                            markConversationReadMutation.mutate({ contactId: conv.user.id });
                                        }
                                    }}
                                    className={`group p-4 rounded-3xl cursor-pointer transition-all duration-300 relative ${selectedContactId === conv.user.id
                                        ? 'bg-gradient-to-br from-[#163022] to-[#0d1d14] text-white shadow-[0_10px_30px_rgba(22,48,34,0.3)]'
                                        : 'bg-white/40 hover:bg-white shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    {conv.unreadCount > 0 && (
                                        <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                                    )}
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="min-w-0 pr-2">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="font-bold text-[14px] truncate">{conv.user.firstName} {conv.user.lastName}</span>
                                                <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md ${selectedContactId === conv.user.id
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                    {conv.user.role === 'CLEANER' ? 'Staff' : conv.user.firstName === 'Guest' ? 'Guest' : 'Client'}
                                                </span>
                                            </div>
                                            <div className={`text-[10px] font-medium truncate ${selectedContactId === conv.user.id ? 'text-white/50' : 'text-gray-400'}`}>
                                                {conv.user.phone}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-medium flex-shrink-0 mt-1 ${selectedContactId === conv.user.id ? 'text-emerald-200' : 'text-gray-400'}`}>
                                            {conv.lastItem && new Date(conv.lastItem.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className={`text-xs mt-2 truncate flex items-center gap-1.5 ${selectedContactId === conv.user.id ? 'text-white/70' : 'text-gray-500'}`}>
                                        {conv.lastItem?.type === 'call' ? (
                                            <><Phone className="w-3 h-3" /> Call {conv.lastItem.status}</>
                                        ) : (
                                            <MessageSquare className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        <span className="truncate">{conv.lastItem?.content || "No records yet"}</span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex flex-1 flex-col">
                    {selectedContactId && selectedConversation ? (
                        <>
                            <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6 px-1">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center border border-emerald-200 shadow-sm">
                                            <User className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {isEditingName ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={editFirstName}
                                                    onChange={(e) => setEditFirstName(e.target.value)}
                                                    className="w-24 bg-white border border-emerald-200 rounded-lg px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                                    placeholder="First Name"
                                                />
                                                <input
                                                    value={editLastName}
                                                    onChange={(e) => setEditLastName(e.target.value)}
                                                    className="w-24 bg-white border border-emerald-200 rounded-lg px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                                    placeholder="Last Name"
                                                />
                                                <button
                                                    onClick={handleSaveName}
                                                    className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                                    disabled={renameContactMutation.isPending}
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingName(false)}
                                                    className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group">
                                                <h3 className="font-bold text-[17px] text-gray-900 leading-tight truncate">
                                                    {selectedConversation.user.firstName} {selectedConversation.user.lastName}
                                                </h3>
                                                <button
                                                    onClick={handleStartEdit}
                                                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all active:scale-90"
                                                    title="Edit Name"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-[12px] font-medium text-gray-400">{selectedConversation.user.phone}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={handleDeleteConversation}
                                        className="p-3 bg-white border border-gray-100 text-rose-500 rounded-2xl hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm active:scale-95"
                                        title="Delete Conversation"
                                        disabled={deleteConversationMutation.isPending}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const { token } = useAuthStore.getState();
                                            if (!token) {
                                                toast.error("Not authenticated");
                                                return;
                                            }
                                            makeCallMutation.mutate({
                                                authToken: token,
                                                toNumber: selectedConversation.user.phone || ""
                                            });
                                        }}
                                        disabled={makeCallMutation.isPending}
                                        className="p-3 bg-white border border-gray-100 text-emerald-600 rounded-2xl hover:bg-emerald-50 hover:border-emerald-100 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                        title="Call via OpenPhone"
                                    >
                                        {makeCallMutation.isPending ? (
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Phone className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar mb-6 scroll-smooth">
                                {activeConversationItems.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                                            <MessageSquare className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm font-medium">New conversation with {selectedConversation.user.firstName}</p>
                                    </div>
                                )}
                                {activeConversationItems.map((item: any) => {
                                    if (item.type === 'call') {
                                        return (
                                            <div key={`call-${item.id}`} className="flex justify-center my-6">
                                                <div className="bg-white/60 border border-gray-100 rounded-[24px] p-5 text-center shadow-sm w-full max-w-md group hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                                                        <div className={`p-1.5 rounded-lg ${item.direction === 'incoming' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                            <Phone className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{item.direction} Call</span>
                                                        <span className="text-[10px] text-gray-300">• {new Date(item.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="text-[15px] font-bold text-gray-800">
                                                        <span className="capitalize">{item.status}</span>
                                                        {item.duration ? <span className="text-gray-400 font-medium font-sans ml-1 text-[13px]">• {Math.floor(item.duration / 60)}m {item.duration % 60}s</span> : ''}
                                                    </div>

                                                    {item.recordingUrl && (
                                                        <div className="mt-4">
                                                            <a
                                                                href={item.recordingUrl}
                                                                target="_blank"
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-colors border border-gray-100"
                                                            >
                                                                <Download className="w-3.5 h-3.5" /> Play Recording
                                                                <span className="w-1 h-3 bg-gray-300 rounded-full mx-1" />
                                                            </a>
                                                        </div>
                                                    )}

                                                    {item.voicemailUrl && (
                                                        <div className="mt-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                                            <div className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter mb-2 flex items-center gap-1.5 justify-center">
                                                                <RefreshCw className="w-3 h-3" /> Voicemail Received
                                                            </div>
                                                            <audio src={item.voicemailUrl} controls className="w-full h-8 brightness-[0.9] grayscale-[0.2]" />
                                                        </div>
                                                    )}

                                                    {item.summary && (
                                                        <div className="mt-4 text-left bg-[#163022]/[0.02] p-4 rounded-2xl border border-[#163022]/[0.05]">
                                                            <div className="text-[10px] font-black text-[#163022]/40 uppercase mb-2 tracking-widest">AI Transcript Summary</div>
                                                            <p className="text-[12px] text-gray-600 leading-relaxed font-medium">
                                                                {item.summary}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }

                                    const isMe = item.senderId === user?.id;
                                    return (
                                        <div key={`msg-${item.id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                                            <div className={`group relative max-w-[75%] shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${isMe
                                                ? 'bg-gradient-to-br from-[#163022] to-[#0d1d14] text-white rounded-[24px] rounded-tr-none'
                                                : 'bg-white border border-gray-100 text-gray-700 rounded-[24px] rounded-tl-none'
                                                }`}>
                                                <div className="p-4">
                                                    <p className="text-[14.5px] leading-relaxed font-sans font-medium whitespace-pre-wrap">{item.content}</p>
                                                    {item.mediaUrls?.length > 0 && (
                                                        <div className="mt-3 grid gap-2 grid-cols-1">
                                                            {item.mediaUrls.map((url: string, idx: number) => (
                                                                <img
                                                                    key={idx}
                                                                    src={url}
                                                                    alt="Attachment"
                                                                    className="max-w-full rounded-2xl shadow-lg border border-white/10 hover:scale-[1.02] transition-transform duration-500"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className={`text-[10px] mt-2 flex items-center gap-2 justify-end font-bold uppercase tracking-tight ${isMe ? 'text-white/50' : 'text-gray-300'}`}>
                                                        {isMe && item.isRead && (
                                                            <span className="text-[9px] text-emerald-400 font-black tracking-tighter mr-1">Read</span>
                                                        )}
                                                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSend} className="relative group">
                                <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-focus-within:bg-emerald-500/10 transition-all rounded-[32px] -m-2" />
                                <div className="relative flex items-center gap-3 bg-white border border-gray-100 rounded-[24px] p-2 shadow-sm focus-within:shadow-md transition-all">
                                    <input
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Write a message..."
                                        className="flex-1 bg-transparent border-none py-3 pl-4 text-sm focus:ring-0 placeholder:text-gray-300 font-medium"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                                        className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-[#163022] to-[#0d1d14] text-white rounded-2xl hover:shadow-[0_10px_20px_rgba(22,48,34,0.3)] disabled:opacity-30 disabled:shadow-none transition-all active:scale-95 group"
                                    >
                                        <Send className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-400">
                            <div className="w-24 h-24 bg-white/40 rounded-[32px] border border-white/60 flex items-center justify-center mb-6 shadow-sm">
                                <MessageSquare className="w-10 h-10 text-emerald-200" />
                            </div>
                            <h4 className="text-gray-900 font-bold mb-1">Your Inbox is Ready</h4>
                            <p className="text-sm">Select a contact to start or manage communications</p>
                        </div>
                    )}
                </div>

            </div>

            <ActionConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Conversation"
                description={`This will permanently delete all messages and call logs with ${selectedConversation?.user.firstName} ${selectedConversation?.user.lastName}. This action cannot be undone.`}
                confirmLabel="Delete Everything"
                variant="danger"
                onConfirm={confirmDeleteConversation}
            />
        </AdminShell>
    );
}

export default CommunicationsPage;
