import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { AdminShell } from "~/components/admin/AdminShell";
import { Trash2, Phone, MessageSquare, Send, Search, RefreshCw, Edit2, Check, X, Download, Plus, Image as ImageIcon, X as CloseIcon, Pin, PinOff, User as UserIcon, Mail } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { ActionConfirmationModal } from "~/components/admin/ActionConfirmationModal";
import { uploadMedia } from "~/utils/uploadMedia";

export const Route = createFileRoute("/admin-portal/communications/")({
    component: CommunicationsPage,
});

function ContactSkeleton() {
    return (
        <div className="p-4 rounded-3xl bg-white/20 animate-pulse mb-3">
            <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-2xl" />
                    <div>
                        <div className="w-24 h-3 bg-gray-200 rounded-full mb-2" />
                        <div className="w-16 h-2 bg-gray-100 rounded-full" />
                    </div>
                </div>
                <div className="w-8 h-2 bg-gray-100 rounded-full" />
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full mt-3" />
        </div>
    );
}

function MessageSkeleton({ isMe }: { isMe: boolean }) {
    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 animate-pulse`}>
            <div className={`w-2/3 h-12 rounded-[24px] ${isMe ? 'bg-emerald-50' : 'bg-gray-100'}`} />
        </div>
    );
}

function CommunicationsPage() {
    const { user } = useAuthStore();
    const trpc = useTRPC();
    const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
    const [messageText, setMessageText] = useState("");
    const [selectedMediaUrls, setSelectedMediaUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileEditData, setProfileEditData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        notes: ""
    });

    const usersQuery = useQuery(trpc.getAllUsersAdmin.queryOptions({}, { staleTime: 300000 })); // 5 mins
    const messagesQuery = useQuery(trpc.messaging.getMessages.queryOptions({}, { staleTime: 300000 })); // 5 mins
    const callsQuery = useQuery(trpc.messaging.getCalls.queryOptions({}, { staleTime: 300000 })); // 5 mins

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

    const updateContactMutation = useMutation(
        trpc.messaging.updateContact.mutationOptions({
            onSuccess: () => {
                usersQuery.refetch();
                setIsProfileModalOpen(false);
                toast.success("Contact updated");
            }
        })
    );

    const togglePinMutation = useMutation(
        trpc.messaging.togglePinContact.mutationOptions({
            onSuccess: () => {
                usersQuery.refetch();
                toast.success("Pin status updated");
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

    // makeCallMutation removed - OpenPhone API doesn't support programmatic calls

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
            })
            .sort((a, b) => {
                if (a.user.isPinned === b.user.isPinned) return 0;
                return a.user.isPinned ? -1 : 1;
            });

        return {
            clients: all.filter(c => c.user.role === 'CLIENT' || c.user.email.includes('@guest')),
            employees: all.filter(c => c.user.role === 'CLEANER' || c.user.role === 'ADMIN' || c.user.role === 'OWNER')
        };
    }, [usersQuery.data, messagesQuery.data, callsQuery.data, searchQuery, user?.id]);

    const allConversations = [...segmentedConversations.clients, ...segmentedConversations.employees];
    const selectedConversation = allConversations.find(c => c.user.id === selectedContactId);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!messageText.trim() && selectedMediaUrls.length === 0) || sendMessageMutation.isPending || isUploading) return;

        sendMessageMutation.mutate({
            recipientId: selectedContactId!,
            content: messageText,
            mediaUrls: selectedMediaUrls,
        }, {
            onSuccess: () => {
                setMessageText("");
                setSelectedMediaUrls([]);
            }
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        const uploadToast = toast.loading("Uploading images...");

        try {
            const urls = await Promise.all(files.map(file => uploadMedia(file)));
            setSelectedMediaUrls(prev => [...prev, ...urls]);
            toast.success("Images uploaded", { id: uploadToast });
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload images", { id: uploadToast });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeMedia = (index: number) => {
        setSelectedMediaUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleStartEdit = () => {
        if (!selectedConversation) return;
        setProfileEditData({
            firstName: selectedConversation.user.firstName || "",
            lastName: selectedConversation.user.lastName || "",
            email: selectedConversation.user.email || "",
            phone: selectedConversation.user.phone || "",
            notes: (selectedConversation.user as any).notes || ""
        });
        setIsProfileModalOpen(true);
    };

    const handleSaveProfile = () => {
        if (!selectedContactId) return;
        updateContactMutation.mutate({
            contactId: selectedContactId,
            ...profileEditData
        });
    };

    const handleTogglePin = (e: React.MouseEvent, contactId: number) => {
        e.stopPropagation();
        togglePinMutation.mutate({ contactId });
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

    // Helper to group by date
    const groupedItems = useMemo(() => {
        const groups: { date: string, items: any[] }[] = [];
        activeConversationItems.forEach(item => {
            const date = new Date(item.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.date === date) {
                lastGroup.items.push(item);
            } else {
                groups.push({ date, items: [item] });
            }
        });
        return groups;
    }, [activeConversationItems]);

    return (
        <AdminShell title="Communications" subtitle="SMS & Calls via OpenPhone">
            <div className="flex h-[calc(100vh-220px)] gap-6 rounded-[32px] border border-white/40 bg-white/40 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl">

                {/* Contact List */}
                <div className="flex w-96 flex-col border-r border-gray-100 pr-4">
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

                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2 pt-2">
                        {usersQuery.isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => <ContactSkeleton key={i} />)
                        ) : currentList.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-xs font-medium italic">
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
                                    className={`group p-3 rounded-2xl cursor-pointer transition-all duration-200 relative mb-1 ${selectedContactId === conv.user.id
                                        ? 'bg-[#163022] text-white shadow-lg'
                                        : 'bg-transparent hover:bg-gray-100/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-shrink-0">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${selectedContactId === conv.user.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                                {conv.user.firstName?.[0] || 'U'}{conv.user.lastName?.[0] || ''}
                                            </div>
                                            {conv.unreadCount > 0 && (
                                                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-baseline gap-1">
                                                <h4 className="font-bold text-[15px] truncate leading-tight">
                                                    {conv.user.firstName} {conv.user.lastName}
                                                </h4>
                                                <span className={`text-[10px] font-medium flex-shrink-0 ${selectedContactId === conv.user.id ? 'text-white/60' : 'text-gray-400'}`}>
                                                    {conv.lastItem && new Date(conv.lastItem.createdAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className={`text-[13px] mt-0.5 truncate flex items-center gap-1 ${selectedContactId === conv.user.id ? 'text-white/80' : 'text-gray-500'}`}>
                                                {conv.lastItem?.type === 'call' ? (
                                                    <><Phone className="w-3 h-3" /> Call</>
                                                ) : conv.lastItem?.senderId === user?.id ? (
                                                    <span className="opacity-50">You:</span>
                                                ) : null}
                                                <span className="truncate">{conv.lastItem?.content || "No records yet"}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleTogglePin(e, conv.user.id)}
                                            className={`p-1.5 rounded-lg transition-colors ${selectedContactId === conv.user.id
                                                ? 'hover:bg-white/20 text-white/40 hover:text-white'
                                                : 'hover:bg-gray-200 text-gray-300 hover:text-gray-500'
                                                } ${conv.user.isPinned ? 'text-blue-400' : ''}`}
                                        >
                                            {conv.user.isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
                                        </button>
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
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#163022] to-[#0d1d14] flex items-center justify-center border border-[#163022]/10 shadow-sm text-white font-bold">
                                            {selectedConversation.user.firstName?.[0] || 'U'}{selectedConversation.user.lastName?.[0] || ''}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 group">
                                            <h3 className="font-bold text-[17px] text-gray-900 leading-tight truncate">
                                                {selectedConversation.user.firstName} {selectedConversation.user.lastName}
                                            </h3>
                                            <button
                                                onClick={handleStartEdit}
                                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all active:scale-90"
                                                title="Edit Contact Profile"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            {selectedConversation.user.isPinned && (
                                                <Pin className="w-3.5 h-3.5 text-blue-500 ml-1" />
                                            )}
                                        </div>
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
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar mb-6 scroll-smooth">
                                {(messagesQuery.isLoading || callsQuery.isLoading) ? (
                                    Array.from({ length: 5 }).map((_, i) => <MessageSkeleton key={i} isMe={i % 2 === 0} />)
                                ) : groupedItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                                            <MessageSquare className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm font-medium">New conversation with {selectedConversation.user.firstName}</p>
                                    </div>
                                ) : (
                                    groupedItems.map((group, gIdx) => (
                                        <div key={group.date} className="space-y-4">
                                            <div className="flex justify-center">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-300 px-3 py-1 bg-gray-50 rounded-full">{group.date}</span>
                                            </div>
                                            {group.items.map((item, idx) => {
                                                if (item.type === 'call') {
                                                    return (
                                                        <div key={`call-${item.id}`} className="flex justify-center my-6">
                                                            <div className="bg-white/60 border border-gray-100 rounded-[24px] p-5 text-center shadow-sm w-full max-w-md group hover:shadow-md transition-shadow">
                                                                <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                                                                    <div className={`p-1.5 rounded-lg ${item.direction === 'incoming' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                                        <Phone className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{item.direction} Call</span>
                                                                    <span className="text-[10px] text-gray-300">• {new Date(item.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                const isMe = item.senderId === user?.id;
                                                const nextItem = group.items[idx + 1];
                                                const isLastInSequence = !nextItem || nextItem.senderId !== item.senderId || nextItem.type !== 'message';

                                                return (
                                                    <div key={`msg-${item.id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isLastInSequence ? 'mb-6' : 'mb-1'}`}>
                                                        <div className={`group relative max-w-[85%] sm:max-w-[70%] transition-transform active:scale-[0.98] ${isMe
                                                            ? `bg-gradient-to-tr from-[#147efb] to-[#248bf5] text-white shadow-sm ${isLastInSequence ? 'rounded-[20px] rounded-br-[4px]' : 'rounded-[20px]'}`
                                                            : `bg-[#e9e9eb] text-black ${isLastInSequence ? 'rounded-[20px] rounded-bl-[4px]' : 'rounded-[20px]'}`
                                                            }`}>
                                                            <div className="px-4 py-2.5">
                                                                <p className="text-[16px] leading-tight font-sans font-medium whitespace-pre-wrap">{item.content}</p>
                                                                {item.mediaUrls?.length > 0 && (
                                                                    <div className="mt-2 grid gap-1 grid-cols-1">
                                                                        {item.mediaUrls.map((url: string, midx: number) => (
                                                                            <img
                                                                                key={midx}
                                                                                src={url}
                                                                                alt="Attachment"
                                                                                className="max-w-full rounded-[14px] shadow-sm hover:scale-[1.02] transition-transform"
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {isLastInSequence && (
                                                                <div className={`text-[10px] absolute -bottom-4 ${isMe ? 'right-0' : 'left-0'} font-bold uppercase tracking-tight text-gray-300`}>
                                                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    {isMe && item.isRead && <span className="ml-1 text-blue-500 font-black">Read</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleSend} className="relative mt-auto">
                                {selectedMediaUrls.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3 px-4">
                                        {selectedMediaUrls.map((url, idx) => (
                                            <div key={idx} className="relative group/item aspect-square w-16">
                                                <img
                                                    src={url}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover rounded-xl border border-gray-100 shadow-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedia(idx)}
                                                    className="absolute -top-1.5 -right-1.5 p-0.5 bg-black/80 text-white rounded-full shadow-md hover:bg-black transition-all"
                                                >
                                                    <CloseIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-end gap-2 px-2 pb-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="mb-1 p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full transition-all disabled:opacity-30"
                                        title="Attach"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                    <div className="flex-1 relative flex items-center bg-[#f2f2f7] border border-gray-200/50 rounded-[22px] min-h-[40px] px-4 py-2 ring-1 ring-inset ring-transparent focus-within:ring-blue-500/20 transition-all">
                                        <input
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            placeholder={isUploading ? "Uploading..." : "iMessage"}
                                            disabled={isUploading}
                                            className="flex-1 bg-transparent border-none p-0 text-[15px] focus:ring-0 placeholder:text-gray-400 font-medium disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={(!messageText.trim() && selectedMediaUrls.length === 0) || sendMessageMutation.isPending || isUploading}
                                            className="ml-2 flex-shrink-0 flex items-center justify-center w-7 h-7 bg-[#248bf5] text-white rounded-full disabled:opacity-30 disabled:grayscale transition-all active:scale-90"
                                        >
                                            <Send className="w-4 h-4 fill-current rotate-45 -translate-y-0.5 translate-x-0.5" />
                                        </button>
                                    </div>
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

            {/* Profile Edit Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden transform transition-all">
                        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Contact Profile</h3>
                                <p className="text-xs text-gray-400 font-medium">Manage details and internal notes</p>
                            </div>
                            <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-900 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">First Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            value={profileEditData.firstName}
                                            onChange={(e) => setProfileEditData(prev => ({ ...prev, firstName: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            placeholder="John"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Last Name</label>
                                    <input
                                        value={profileEditData.lastName}
                                        onChange={(e) => setProfileEditData(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        value={profileEditData.phone}
                                        onChange={(e) => setProfileEditData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        value={profileEditData.email}
                                        onChange={(e) => setProfileEditData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center justify-between">
                                    Internal Notes
                                    <span className="font-medium lowercase tracking-normal text-gray-300">Visible only to admins</span>
                                </label>
                                <textarea
                                    value={profileEditData.notes}
                                    onChange={(e) => setProfileEditData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={4}
                                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                    placeholder="Add details about this client, preferences, or issues..."
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="flex-1 py-4 text-sm font-bold text-gray-500 hover:text-gray-900 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={updateContactMutation.isPending}
                                className="flex-[2] py-4 bg-[#163022] text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                            >
                                {updateContactMutation.isPending ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

export default CommunicationsPage;
