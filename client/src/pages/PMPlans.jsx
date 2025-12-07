import React, { useState, useEffect } from 'react';
import { dbQuery } from '../api';
import PMPlanForm from '../components/PMPlanForm';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../utils/activityLogger';

const PMPlans = () => {
    const { user } = useAuth();
    const [plans, setPlans] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    const fetchPlans = async () => {
        try {
            const result = await dbQuery(`
        SELECT p.*, a.name as asset_name 
        FROM pm_plans p 
        JOIN assets a ON p.asset_id = a.id 
        ORDER BY p.next_due_date ASC
      `);
            setPlans(result);
        } catch (err) {
            console.error('Error fetching plans:', err);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this PM plan?')) {
            // Get plan details before deletion
            const plan = plans.find(p => p.id === id);

            await dbQuery('DELETE FROM pm_plans WHERE id = ?', [id]);

            // Log the deletion
            await logActivity(user, 'delete', 'pm_plan', id, plan?.title || 'Unknown', { deleted: plan });

            fetchPlans();
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingPlan(null);
        setShowModal(true);
    };

    const handlePrint = (plan) => {
        const printWindow = window.open('', '_blank');
        let checklist = [];
        try {
            checklist = typeof plan.checklist === 'string' ? JSON.parse(plan.checklist) : plan.checklist;
        } catch (e) {
            checklist = [];
        }

        printWindow.document.write(`
            <html>
            <head>
                <title>PM Plan - ${plan.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
                    .header-info { margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                    .label { font-weight: bold; color: #64748b; }
                    .checklist { margin-top: 20px; }
                    .checklist-item { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
                    .checkbox { width: 20px; height: 20px; border: 2px solid #cbd5e1; margin-right: 10px; display: inline-block; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>PM Plan Details</h1>
                
                <div class="header-info">
                    <div><span class="label">Asset:</span> ${plan.asset_name}</div>
                    <div><span class="label">Plan Title:</span> ${plan.title}</div>
                    <div><span class="label">Frequency:</span> ${plan.frequency_days} Days</div>
                    <div><span class="label">Next Due:</span> ${plan.next_due_date}</div>
                </div>

                <h2>Checklist</h2>
                <div class="checklist">
                    ${checklist && checklist.length > 0 ? checklist.map(item => `
                        <div class="checklist-item">
                            <span class="checkbox"></span>
                            <span>${item.label}</span>
                        </div>
                    `).join('') : '<p>No checklist items defined.</p>'}
                </div>

                <div style="margin-top: 40px; border-top: 1px solid #000; padding-top: 10px; display: flex; justify-content: space-between;">
                    <div>Technician Signature: _________________</div>
                    <div>Date: _________________</div>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1>PM Plans</h1>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    + Create PM Plan
                </button>
            </div>

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Asset</th>
                            <th>Title</th>
                            <th>Frequency (Days)</th>
                            <th>Next Due</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map((plan) => (
                            <tr key={plan.id}>
                                <td>{plan.asset_name}</td>
                                <td>{plan.title}</td>
                                <td>{plan.frequency_days}</td>
                                <td>{plan.next_due_date}</td>
                                <td>
                                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => handlePrint(plan)}>Print</button>
                                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => handleEdit(plan)}>Edit</button>
                                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(plan.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <PMPlanForm
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); fetchPlans(); }}
                    initialData={editingPlan}
                />
            )}
        </div>
    );
};

export default PMPlans;
