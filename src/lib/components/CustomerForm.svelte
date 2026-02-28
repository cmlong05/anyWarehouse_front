<script lang="ts">
    import { customerSchema, type CustomerFormData } from '$lib/schemas';
    import { FormInput, FormSelect } from '$lib/components/ui';
    
    interface Props {
        onSubmit: (data: CustomerFormData) => void;
        onCancel: () => void;
        initialData?: Partial<CustomerFormData>;
        submitLabel?: string;
        loading?: boolean;
    }
    
    let { 
        onSubmit, 
        onCancel, 
        initialData = {},
        submitLabel = '保存',
        loading = false 
    }: Props = $props();
    
    let formData: CustomerFormData = $state({
        code: initialData.code || '',
        name: initialData.name || '',
        contact_name: initialData.contact_name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        level: initialData.level || 'NORMAL',
        status: initialData.status || 'ACTIVE',
        remark: initialData.remark || ''
    });
    
    let errors: Record<string, string> = $state({});
    
    const levelOptions = [
        { value: 'VIP', label: 'VIP客户' },
        { value: 'NORMAL', label: '普通客户' },
        { value: 'TEMP', label: '临时客户' }
    ];
    
    const statusOptions = [
        { value: 'ACTIVE', label: '活跃' },
        { value: 'INACTIVE', label: '停用' }
    ];
    
    function validate(): boolean {
        errors = {};
        const result = customerSchema.safeParse(formData);
        
        if (!result.success) {
            for (const issue of result.error.issues) {
                const path = issue.path[0] as string;
                errors[path] = issue.message;
            }
            return false;
        }
        return true;
    }
    
    function handleSubmit(e: Event) {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    }
    
    function clearError(field: string) {
        if (errors[field]) {
            errors = { ...errors, [field]: '' };
        }
    }
</script>

<form onsubmit={handleSubmit} class="customer-form">
    <div class="form-row">
        <FormInput
            label="客户编号"
            name="code"
            required
            value={formData.code}
            placeholder="如：C000001"
            error={errors.code}
            disabled={loading}
            oninput={(v) => { formData.code = v; clearError('code'); }}
        />
        
        <FormInput
            label="客户名称"
            name="name"
            required
            value={formData.name}
            placeholder="输入客户名称"
            error={errors.name}
            disabled={loading}
            oninput={(v) => { formData.name = v; clearError('name'); }}
        />
    </div>
    
    <div class="form-row">
        <FormInput
            label="联系人"
            name="contact_name"
            value={formData.contact_name || ''}
            placeholder="输入联系人姓名"
            disabled={loading}
            oninput={(v) => formData.contact_name = v}
        />
        
        <FormInput
            label="联系电话"
            name="phone"
            value={formData.phone || ''}
            placeholder="输入联系电话"
            disabled={loading}
            oninput={(v) => formData.phone = v}
        />
    </div>
    
    <div class="form-row">
        <FormInput
            label="电子邮箱"
            name="email"
            type="email"
            value={formData.email || ''}
            placeholder="输入邮箱地址"
            error={errors.email}
            disabled={loading}
            oninput={(v) => { formData.email = v; clearError('email'); }}
        />
        
        <FormInput
            label="主地址"
            name="address"
            value={formData.address || ''}
            placeholder="输入主地址"
            disabled={loading}
            oninput={(v) => formData.address = v}
        />
    </div>
    
    <div class="form-row">
        <FormSelect
            label="客户等级"
            name="level"
            options={levelOptions}
            value={formData.level}
            disabled={loading}
            onchange={(v) => formData.level = v as 'VIP' | 'NORMAL' | 'TEMP'}
        />
        
        <FormSelect
            label="状态"
            name="status"
            options={statusOptions}
            value={formData.status}
            disabled={loading}
            onchange={(v) => formData.status = v as 'ACTIVE' | 'INACTIVE'}
        />
    </div>
    
    <div class="form-field">
        <label for="remark">备注</label>
        <textarea
            id="remark"
            rows="3"
            bind:value={formData.remark}
            placeholder="输入备注信息（可选）"
            disabled={loading}
        ></textarea>
        {#if errors.remark}
            <span class="error">{errors.remark}</span>
        {/if}
    </div>
    
    <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick={onCancel} disabled={loading}>
            取消
        </button>
        <button type="submit" class="btn btn-primary" disabled={loading}>
            {loading ? '保存中...' : submitLabel}
        </button>
    </div>
</form>

<style>
    .customer-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    
    @media (max-width: 640px) {
        .form-row {
            grid-template-columns: 1fr;
        }
    }
    
    .form-row :global(.form-field) {
        margin: 0;
    }
    
    .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }
    
    .form-field label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }
    
    textarea {
        padding: 0.625rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.95rem;
        resize: vertical;
        min-height: 80px;
    }
    
    textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    textarea:disabled {
        background-color: #f3f4f6;
        cursor: not-allowed;
    }
    
    .error {
        font-size: 0.875rem;
        color: #dc2626;
    }
    
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
    }
    
    .btn {
        padding: 0.625rem 1.25rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }
    
    .btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
        background-color: #2563eb;
    }
    
    .btn-secondary {
        background-color: #6b7280;
        color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
        background-color: #4b5563;
    }
</style>
