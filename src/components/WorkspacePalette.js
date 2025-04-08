import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Command } from 'cmdk';
import { supabase } from '../supabaseClient';
import { Users, Plus, Settings, UserPlus, Trash2, ChevronLeft, Check, X, DoorOpen, Mail } from 'lucide-react';
import '../styles/WorkspacePalette.css';

const WorkspacePalette = forwardRef(({ isOpen, onClose, onWorkspaceChange, currentWorkspace }, ref) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState('root');
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [members, setMembers] = useState([]);
    const [pageHistory, setPageHistory] = useState(['root']);
    const [invites, setInvites] = useState([]);

    useImperativeHandle(ref, () => ({
        setPage: (newPage) => setPage(newPage),
        setSelectedWorkspace: (workspace) => setSelectedWorkspace(workspace)
    }));

    useEffect(() => {
        if (isOpen) {
            console.log('Workspace Palette opened, loading data...');
            loadWorkspaces();
            loadInvites();
        }
    }, [isOpen]);

    const loadWorkspaces = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('workspaces')
                .select(`
                    *,
                    workspace_members!inner (
                        user_id,
                        role
                    )
                `)
                .eq('workspace_members.user_id', user.id);

            if (error) throw error;
            setWorkspaces(data);
        } catch (error) {
            console.error('Error loading workspaces:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWorkspaceMembers = async (workspaceId) => {
        try {
            const { data, error } = await supabase
                .from('workspace_members')
                .select(`
                    *,
                    users:user_id (
                        email
                    )
                `)
                .eq('workspace_id', workspaceId);

            if (error) throw error;
            setMembers(data);
        } catch (error) {
            console.error('Error loading members:', error);
        }
    };

    const createWorkspace = async () => {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            // First create the workspace
            const { data: workspace, error: workspaceError } = await supabase
                .from('workspaces')
                .insert({
                    name: newWorkspaceName,
                    description: newWorkspaceDesc,
                    created_by: user.id
                })
                .select()
                .single();

            if (workspaceError) throw workspaceError;

            // Then add the creator as an owner
            const { error: memberError } = await supabase
                .from('workspace_members')
                .insert({
                    workspace_id: workspace.id,
                    user_id: user.id,
                    role: 'owner',
                });

            if (memberError) {
                console.error('Member creation error:', memberError);
                // Cleanup the workspace if member creation fails
                await supabase.from('workspaces').delete().eq('id', workspace.id);
                throw memberError;
            }

            setNewWorkspaceName('');
            setNewWorkspaceDesc('');
            goBack();
            await loadWorkspaces();
        } catch (error) {
            console.error('Error creating workspace:', error);
            alert(error.message || 'Failed to create workspace');
        }
    };

    const inviteMember = async () => {
        if (!inviteEmail.trim() || !selectedWorkspace) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Create invite directly without checking user existence
            const { error: inviteError } = await supabase
                .from('workspace_invitations')
                .insert({
                    workspace_id: selectedWorkspace.id,
                    inviter_id: user.id,
                    invitee_email: inviteEmail.trim(),
                    status: 'pending'
                });

            if (inviteError) throw inviteError;

            setInviteEmail('');
            alert('Invitation sent successfully!');
            goBack();
        } catch (error) {
            console.error('Error inviting member:', error);
            alert('Failed to invite member: ' + error.message);
        }
    };

    const navigateTo = (newPage) => {
        setPageHistory(prev => [...prev, newPage]);
        setPage(newPage);
    };

    const goBack = () => {
        if (pageHistory.length > 1) {
            const newHistory = [...pageHistory];
            newHistory.pop();
            setPageHistory(newHistory);
            setPage(newHistory[newHistory.length - 1]);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isOpen && e.key === 'ArrowLeft' && pageHistory.length > 1) {
                e.preventDefault();
                goBack();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, pageHistory]);

    const handleWorkspaceSelect = (workspace) => {
        setSelectedWorkspace(workspace);
        loadWorkspaceMembers(workspace.id);
        onWorkspaceChange(workspace);
        onClose();
    };

    const handleInvite = async (inviteId, accept) => {
        try {
            const { error } = await supabase
                .from('workspace_invitations')
                .update({ 
                    status: accept ? 'accepted' : 'rejected'
                })
                .eq('id', inviteId);

            if (error) throw error;
            
            // The trigger we created will automatically add the user as a member
            // when the status is updated to 'accepted'
            
            await loadInvites();
            await loadWorkspaces();
        } catch (error) {
            console.error('Error handling invite:', error);
            alert('Failed to handle invite: ' + error.message);
        }
    };

    const loadInvites = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('Current user email:', user.email);
            
            // Log the query we're about to make
            console.log('Querying invitations for email:', user.email);
            
            // First get just the invitations
            const { data: invitesData, error: invitesError } = await supabase
                .from('workspace_invitations')
                .select('id, workspace_id, inviter_id, invitee_email, status, created_at')
                .eq('invitee_email', user.email)
                .eq('status', 'pending');

            if (invitesError) {
                console.error('Error fetching invites:', invitesError);
                console.error('Error details:', invitesError.message, invitesError.details, invitesError.hint);
                throw invitesError;
            }

            console.log('Raw invites data:', invitesData);

            if (invitesData && invitesData.length > 0) {
                // Get workspace details
                const { data: workspacesData, error: workspacesError } = await supabase
                    .from('workspaces')
                    .select('id, name, description')
                    .in('id', invitesData.map(invite => invite.workspace_id));

                if (workspacesError) {
                    console.error('Error fetching workspaces:', workspacesError);
                }

                // Get inviter details - using auth.users instead of profiles
                const { data: invitersData, error: invitersError } = await supabase
                    .from('auth.users')
                    .select('id, email')
                    .in('id', invitesData.map(invite => invite.inviter_id));

                if (invitersError) {
                    console.error('Error fetching inviters:', invitersError);
                    // If we can't get inviter details, just use the IDs
                    const enrichedInvites = invitesData.map(invite => ({
                        ...invite,
                        workspaces: workspacesData?.find(w => w.id === invite.workspace_id) || null,
                        inviter: { id: invite.inviter_id, email: 'Unknown User' }
                    }));
                    console.log('Enriched invites (without inviter details):', enrichedInvites);
                    setInvites(enrichedInvites);
                    return;
                }

                // Combine all the data
                const enrichedInvites = invitesData.map(invite => ({
                    ...invite,
                    workspaces: workspacesData?.find(w => w.id === invite.workspace_id) || null,
                    inviter: invitersData?.find(u => u.id === invite.inviter_id) || { id: invite.inviter_id, email: 'Unknown User' }
                }));

                console.log('Enriched invites:', enrichedInvites);
                setInvites(enrichedInvites);
            } else {
                console.log('No pending invites found');
                setInvites([]);
            }
        } catch (error) {
            console.error('Error in loadInvites:', error);
            setInvites([]);
        }
    };

    // Add debug render for invites
    console.log('Current invites state:', invites);

    return (
        <Command.Dialog
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            label="Workspace Palette"
            className="workspace-palette"
        >
            <div className="search-header">
                <div className="search-input-wrapper">
                    <Command.Input 
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Search workspaces..."
                        className="workspace-search"
                    />
                </div>
                <div className="close-hint">
                    <span className="kbd">esc</span>
                    <span className="hint-text">to close</span>
                </div>
            </div>

            <Command.List>
                {page === 'root' && (
                    <Command.Group heading="WORKSPACES">
                        {workspaces.map((workspace) => (
                            <Command.Item
                                key={workspace.id}
                                onSelect={() => handleWorkspaceSelect(workspace)}
                                className="workspace-item"
                            >
                                <Users size={16} />
                                {workspace.name}
                                <div className="workspace-actions">
                                    <button 
                                        className="workspace-icon-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedWorkspace(workspace);
                                            navigateTo('members');
                                        }}
                                    >
                                        <UserPlus size={16} />
                                    </button>
                                    <span className="workspace-role">
                                        {workspace.workspace_members[0].role}
                                    </span>
                                </div>
                            </Command.Item>
                        ))}
                        
                        <Command.Item
                            onSelect={() => navigateTo('create')}
                            className="workspace-action"
                        >
                            <Plus size={16} />
                            Create New Workspace
                        </Command.Item>

                        {invites.length > 0 && (
                            <Command.Item
                                onSelect={() => navigateTo('invites')}
                                className="workspace-action"
                            >
                                <Mail size={16} />
                                View Pending Invites ({invites.length})
                            </Command.Item>
                        )}

                        {currentWorkspace && (
                            <Command.Item
                                onSelect={() => onWorkspaceChange(null)}
                                className="workspace-action exit"
                            >
                                <DoorOpen size={16} />
                                Exit Workspace
                            </Command.Item>
                        )}
                    </Command.Group>
                )}

                {page === 'create' && (
                    <Command.Group heading="CREATE WORKSPACE">
                        <div className="workspace-form">
                            <input
                                type="text"
                                placeholder="Workspace name"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                className="workspace-input"
                            />
                            <input
                                type="text"
                                placeholder="Description (optional)"
                                value={newWorkspaceDesc}
                                onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                                className="workspace-input"
                            />
                            <div className="workspace-form-actions">
                                <button onClick={goBack} className="workspace-btn secondary">
                                    Cancel
                                </button>
                                <button 
                                    onClick={createWorkspace}
                                    disabled={!newWorkspaceName.trim()}
                                    className="workspace-btn primary"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </Command.Group>
                )}

                {page === 'members' && currentWorkspace && (
                    <Command.Group heading="MANAGE MEMBERS">
                        <div className="members-section">
                            <div className="invite-form">
                                <input
                                    type="email"
                                    placeholder="Invite member by email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                                <button 
                                    onClick={inviteMember}
                                    disabled={!inviteEmail.trim()}
                                    className="send-invite-btn"
                                >
                                    <UserPlus size={16} />
                                    Send Invite
                                </button>
                            </div>

                            <div className="members-list">
                                {members.map((member) => (
                                    <div key={member.user_id} className="member-item">
                                        <span>{member.users.email}</span>
                                        <span className="member-role">{member.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Command.Group>
                )}

                {page === 'invites' && (
                    <Command.Group heading="PENDING INVITES">
                        <div className="invites-list">
                            {invites.map((invite) => (
                                <div key={invite.id} className="invite-item">
                                    <div className="invite-info">
                                        <strong>{invite.workspaces?.name}</strong>
                                        <span>from {invite.inviter?.email}</span>
                                    </div>
                                    <div className="invite-actions">
                                        <button 
                                            onClick={() => handleInvite(invite.id, true)}
                                            className="workspace-btn accept"
                                        >
                                            <Check size={16} />
                                            Accept
                                        </button>
                                        <button 
                                            onClick={() => handleInvite(invite.id, false)}
                                            className="workspace-btn reject"
                                        >
                                            <X size={16} />
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {invites.length === 0 && (
                                <div className="no-invites">
                                    <Mail size={24} />
                                    <p>No pending invitations</p>
                                </div>
                            )}
                        </div>
                    </Command.Group>
                )}

                {page !== 'root' && (
                    <Command.Item
                        onSelect={goBack}
                        className="workspace-back"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </Command.Item>
                )}
            </Command.List>
        </Command.Dialog>
    );
});

export default WorkspacePalette; 