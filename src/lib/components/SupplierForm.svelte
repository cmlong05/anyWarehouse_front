<script lang="ts">
    import type { Supplier, SupplierCreateRequest } from '$lib';
    import { FormInput } from '$lib/components/ui';
    
    interface Props {
        supplier?: Supplier;
        onSubmit: (data: SupplierCreateRequest) => void;
        onCancel: () => void;
        submitLabel?: string;
        loading?: boolean;
    }
    
    let { 
        supplier, 
        onSubmit, 
        onCancel, 
        submitLabel = '保存',
        loading = false
    }: Props = $props();
    
    // 表单数据
    let formData: SupplierCreateRequest = $state({
        code: supplier?.code ?? '',
        name: supplier?.name ?? '',
        contact: supplier?.contact ?? '',
        e_mail: supplier?.e_mail ?? '',
        telephone: supplier?.telephone ?? '',
        address: supplier?.address ?? '',
        remark: supplier?.remark ?? '',
        is_active: supplier?.is_active ?? true,
    });
    
    // 错误信息
    let errors: Record<string, string> = $state({});
    
    function validate(): boolean {
        errors = {};
        
        if (!formData.code?.trim()) {
            errors.code = '供应商编号不能为空';
        }
        
        if (!formData.name?.trim()) {
            errors.name = '供应商名称不能为空';
        }
        
        if (formData.e_mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.e_mail)) {
            errors.e_mail = '邮箱格式不正确';
        }
        
        return Object.keys(errors).length === 0;
    }
    
    function handleSubmit(e: Event) {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    }
</script>

<form class="supplier-form" onsubmit={handleSubmit}>
    <div class="form-grid">
        <FormInput
            label="供应商编号"
            name="code"
            required
            error={errors.code}
            value={formData.code}
            placeholder="请输入供应商编号"
            disabled={loading}
            oninput={(v) => formData.code = v}
        />
        
        <FormInput
            label="供应商名称"
            name="name"
            required
            error={errors.name}
            value={formData.name}
            placeholder="请输入供应商名称"
            disabled={loading}
            oninput={(v) => formData.name = v}
        />
        
        <FormInput
            label="联系人"
            name="contact"
            value={formData.contact || ''}
            placeholder="请输入联系人姓名"
            disabled={loading}
            oninput={(v) => formData.contact = v}
        />
        
        <FormInput
            label="联系电话"
            name="telephone"
            type="tel"
            value={formData.telephone || ''}
            placeholder="请输入联系电话"
            disabled={loading}
            oninput={(v) => formData.telephone = v}
        />
        
        <FormInput
            label="电子邮箱"
            name="e_mail"
            type="email"
            error={errors.e_mail}
            value={formData.e_mail || ''}
            placeholder="请输入电子邮箱"
            disabled={loading}
            oninput={(v) => formData.e_mail = v}
        />
        
        <div class="form-field full-width">
            <label for="address">地址</label>
            <input
                type="text"
                id="address"
                bind:value={formData.address}
                placeholder="请输入供应商地址"
                disabled={loading}
            />
        </div>
        
        <div class="form-field full-width">
            <label for="remark">备注</label>
            <textarea
                id="remark"
                bind:value={formData.remark}
                placeholder="请输入备注信息"
                rows="3"
                disabled={loading}
            ></textarea>
        </div>
        
        <div class="form-field checkbox-group">
            <label class="checkbox-label">
                <input
                    type="checkbox"
                    bind:checked={formData.is_active}
                    disabled={loading}
                />
                <span>活跃状态</span>
            </label>
            <span class="help-text">取消勾选将禁用此供应商</span>
        </div>
    </div>
    
    <div class="form-actions">
        <button 
            type="button" 
            class="btn btn-secondary" 
            onclick={onCancel}
            disabled={loading}
        >
            取消
        </button>
        <button 
            type="submit" 
            class="btn btn-primary"
            disabled={loading}
        >
            {loading ? '保存中...' : submitLabel}
        </button>
    </div>
</form>

<style>
    .supplier-form {
        max-width: 800px;
    }
    
    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .form-grid :global(.form-field) {
        margin: 0;
    }
    
    .form-grid :global(.form-field.full-width) {
        grid-column: 1 / -1;
    }
    
    .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .form-field.full-width {
        grid-column: 1 / -1;
    }
    
    .form-field label {
        font-weight: 500;
        color: #333;
        font-size: 0.9rem;
    }
    
    .form-field input,
    .form-field textarea {
        padding: 0.625rem 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.15s ease;
        width: 100%;
        box-sizing: border-box;
    }
    
    .form-field input:focus,
    .form-field textarea:focus {
        outline: none;
        border-color: #007bff;
    }
    
    .form-field input:disabled,
    .form-field textarea:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }
    
    .checkbox-group {
        flex-direction: row;
        align-items: center;
        gap: 1rem;
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }
    
    .checkbox-label input {
        width: 1.2rem;
        height: 1.2rem;
        cursor: pointer;
    }
    
    .help-text {
        color: #666;
        font-size: 0.85rem;
    }
    
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1.5rem;
        border-top: 1px solid #eee;
    }
    
    .btn {
        padding: 0.625rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .btn-primary {
        background-color: #007bff;
        color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
        background-color: #0056b3;
    }
    
    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
        background-color: #545b62;
    }
    
    @media (max-width: 768px) {
        .form-grid {
            grid-template-columns: 1fr;
        }
        
        .form-actions {
            flex-direction: column-reverse;
        }
        
        .btn {
            width: 100%;
        }
    }
</style>
