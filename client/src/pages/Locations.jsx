import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import { Folder, FolderOpen, MapPin, Plus, Trash2, Edit2, ChevronRight, ChevronDown } from 'lucide-react';

const Locations = () => {
    const [locations, setLocations] = useState([]);
    const [flatLocations, setFlatLocations] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingLoc, setEditingLoc] = useState(null);
    const [formData, setFormData] = useState({ name: '', parent_id: '' });
    const [expanded, setExpanded] = useState({});

    const fetchLocations = async () => {
        try {
            const result = await dbQuery('SELECT * FROM locations ORDER BY name ASC');
            setFlatLocations(result);
            const tree = buildTree(result);
            setLocations(tree);
        } catch (err) {
            console.error('Error fetching locations:', err);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const buildTree = (items) => {
        const rootItems = [];
        const lookup = {};
        items.forEach(item => {
            lookup[item.id] = { ...item, children: [] };
        });
        items.forEach(item => {
            if (item.parent_id) {
                if (lookup[item.parent_id]) {
                    lookup[item.parent_id].children.push(lookup[item.id]);
                }
            } else {
                rootItems.push(lookup[item.id]);
            }
        });
        return rootItems;
    };

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAdd = (parentId = null) => {
        setEditingLoc(null);
        setFormData({ name: '', parent_id: parentId || '' });
        setShowModal(true);
    };

    const handleEdit = (loc) => {
        setEditingLoc(loc);
        setFormData({ name: loc.name, parent_id: loc.parent_id || '' });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure? This will delete all sub-locations and unlink assets.')) {
            await dbQuery('DELETE FROM locations WHERE id = ?', [id]);
            fetchLocations();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLoc) {
                await dbQuery('UPDATE locations SET name = ?, parent_id = ? WHERE id = ?',
                    [formData.name, formData.parent_id || null, editingLoc.id]);
            } else {
                await dbQuery('INSERT INTO locations (name, parent_id) VALUES (?, ?)',
                    [formData.name, formData.parent_id || null]);
            }
            setShowModal(false);
            fetchLocations();
        } catch (err) {
            console.error('Error saving location:', err);
        }
    };

    const renderTree = (nodes, level = 0) => {
        return nodes.map(node => (
            <div key={node.id} style={{ marginLeft: level * 20 }}>
                <div className="card" style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    borderLeft: `4px solid var(--primary-color)`
                }}>
                    <div
                        style={{ cursor: 'pointer', marginRight: '0.5rem', display: 'flex', alignItems: 'center' }}
                        onClick={() => toggleExpand(node.id)}
                    >
                        {node.children.length > 0 ? (
                            expanded[node.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                        ) : <div style={{ width: 16 }} />}
                    </div>

                    <div style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }}>
                        {node.children.length > 0 ? (expanded[node.id] ? <FolderOpen size={20} /> : <Folder size={20} />) : <MapPin size={20} />}
                    </div>

                    <span style={{ fontWeight: '500', flex: 1 }}>{node.name}</span>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
                            onClick={() => handleAdd(node.id)}
                        >
                            Add Sub-location
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => handleEdit(node)} title="Edit">
                            <Edit2 size={16} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem' }} onClick={() => handleDelete(node.id)} title="Delete">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                {expanded[node.id] && node.children.length > 0 && (
                    <div>{renderTree(node.children, level + 1)}</div>
                )}
            </div>
        ));
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1>Location Hierarchy</h1>
                <button className="btn btn-primary" onClick={() => handleAdd(null)}>
                    + Add Root Location
                </button>
            </div>

            <div style={{ maxWidth: '800px' }}>
                {renderTree(locations)}
                {locations.length === 0 && <p>No locations defined.</p>}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h2>{editingLoc ? 'Edit Location' : 'Add Location'}</h2>
                        <form onSubmit={handleSubmit}>
                            <label>Name</label>
                            <input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                autoFocus
                            />

                            <label>Parent Location</label>
                            <select
                                value={formData.parent_id}
                                onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                            >
                                <option value="">(Root)</option>
                                {flatLocations
                                    .filter(l => l.id !== editingLoc?.id) // Prevent self-parenting
                                    .map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                            </select>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Locations;
