import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MapPin, Check } from 'lucide-react';

const LocationSelector = ({ value, onChange, locations }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [selectedNode, setSelectedNode] = useState(null);
    const dropdownRef = useRef(null);

    // Build tree structure
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

    const treeData = buildTree(locations);

    useEffect(() => {
        if (value) {
            const selected = locations.find(l => l.id == value);
            setSelectedNode(selected);
            // Auto-expand parents of selected node
            if (selected) {
                const newExpanded = {};
                let current = selected;
                while (current.parent_id) {
                    newExpanded[current.parent_id] = true;
                    current = locations.find(l => l.id == current.parent_id);
                    if (!current) break;
                }
                setExpanded(prev => ({ ...prev, ...newExpanded }));
            }
        } else {
            setSelectedNode(null);
        }
    }, [value, locations]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelect = (node) => {
        onChange({ target: { name: 'location_id', value: node.id } });
        setIsOpen(false);
    };

    const renderTree = (nodes, level = 0) => {
        return nodes.map(node => {
            const isExpanded = expanded[node.id];
            const isSelected = value == node.id;
            const hasChildren = node.children && node.children.length > 0;

            return (
                <div key={node.id}>
                    <div
                        onClick={() => handleSelect(node)}
                        style={{
                            paddingLeft: `${level * 20 + 12}px`,
                            paddingRight: '12px',
                            paddingTop: '8px',
                            paddingBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                            color: isSelected ? 'var(--primary-color)' : 'inherit',
                            transition: 'background-color 0.2s'
                        }}
                        className="hover:bg-gray-50"
                    >
                        <div
                            onClick={(e) => hasChildren && toggleExpand(e, node.id)}
                            style={{
                                marginRight: '8px',
                                cursor: hasChildren ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                width: '20px',
                                justifyContent: 'center'
                            }}
                        >
                            {hasChildren && (
                                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                            )}
                        </div>

                        <div style={{ marginRight: '8px', color: isSelected ? 'var(--primary-color)' : '#64748b' }}>
                            {hasChildren ? (
                                isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
                            ) : (
                                <MapPin size={16} />
                            )}
                        </div>

                        <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>{node.name}</span>

                        {isSelected && <Check size={16} />}
                    </div>
                    {hasChildren && isExpanded && (
                        <div>{renderTree(node.children, level + 1)}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--background-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '38px'
                }}
            >
                <span style={{ color: selectedNode ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {selectedNode ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={14} /> {selectedNode.name}
                        </span>
                    ) : 'Select Location...'}
                </span>
                <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'white',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    zIndex: 50,
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    {locations.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No locations found
                        </div>
                    ) : (
                        <div style={{ padding: '4px 0' }}>
                            {renderTree(treeData)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationSelector;
