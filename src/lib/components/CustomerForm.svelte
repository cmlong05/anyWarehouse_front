<script lang="ts">
    import { customerSchema, type CustomerFormData } from '$lib/schemas';
    
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
    
    // 表单数据
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
    
    // 错误信息
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
    
    function handleInput(field: keyof CustomerFormData) {
        return (e: Event) => {
            const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            formData = { ...formData, [field]: target.value };
            // 清除该字段的错误
            if (errors[field]) {
                errors = { ...errors, [field]: '' };
            }
        };
    }
</script>

<form onsubmit={handleSubmit} class="customer-form">
    <div class="form-row">
        <div class="form-group required">
            <label for="code">客户编号</label>
            <input
                type="text"
                id="code"
                value={formData.code}
                oninput={handleInput('code')}
                placeholder="如：C000001"
                disabled={loading}
            />
            {#if errors.code}
                <span class="error">{errors.code}</span>
            {/if}
        </div>
        
        <div class="form-group required">
            <label for="name">客户名称</label>
            <input
                type="text"
                id="name"
                value={formData.name}
                oninput={handleInput('name')}
                placeholder="输入客户名称"
                disabled={loading}
            />
            {#if errors.name}
                <span class="error">{errors.name}</span>
            {/if}
        </div>
    </div>
    
    <div class="form-row">
        <div class="form-group">
            <label for="contact_name">联系人</label>
            <input
                type="text"
                id="contact_name"
                value={formData.contact_name}
                oninput={handleInput('contact_name')}
                placeholder="输入联系人姓名"
                disabled={loading}
            />
        </div>
        
        <div class="form-group">
            <label for="phone">联系电话</label>
            <input
                type="text"
                id="phone"
                value={formData.phone}
                oninput={handleInput('phone')}
                placeholder="输入联系电话"
                disabled={loading}
            />
        </div>
    </div>
    
    <div class="form-row">
        <div class="form-group">
            <label for="email">电子邮箱</label>
            <input
                type="email"
                id="email"
                value={formData.email}
                oninput={handleInput('email')}
                placeholder="输入邮箱地址"
                disabled={loading}
            />
            {#if errors.email}
                <span class="error">{errors.email}</span>
            {/if}
        </div>
        
        <div class="form-group">
            <label for="address">主地址</label>
            <input
                type="text"
                id="address"
                value={formData.address}
                oninput={handleInput('address')}
                placeholder="输入主地址"
                disabled={loading}
            />
        </div>
    </div>
    
    <div class="form-row">
        <div class="form-group">
            <label for="level">客户等级</label>
            <select
                id="level"
                value={formData.level}
                onchange={handleInput('level')}
                disabled={loading}
            >
                {#each levelOptions as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </div>
        
        <div class="form-group">
            <label for="status">状态</label>
            <select
                id="status"
                value={formData.status}
                onchange={handleInput('status')}
                disabled={loading}
            >
                {#each statusOptions as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </div>
    </div>
    
    <div class="form-group">
        <label for="remark">备注</label>
        <textarea
            id="remark"
            rows="3"
            value={formData.remark}
            oninput={handleInput('remark')}
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
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }
    
    .form-group.required label::after {
        content: ' *';
        color: #dc2626;
    }
    
    label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }
    
    input, select, textarea {
        padding: 0.625rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.95rem;
        background-color: white;
    }
    
    input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    input:disabled, select:disabled, textarea:disabled {
        background-color: #f3f4f6;
        cursor: not-allowed;
    }
    
    textarea {
        resize: vertical;
        min-height: 80px;
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
