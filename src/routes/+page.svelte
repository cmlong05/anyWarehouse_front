<div class="home-container">
    <h1>AnyWarehouse 仓库管理系统</h1>
    <p>欢迎使用仓库管理系统</p>
    
    <div class="quick-actions">
        <h3>快速操作</h3>
        <div class="action-buttons">
            <a href="/container/add" class="btn btn-primary">
                添加根容器
            </a>
        </div>
    </div>
</div>

<style>
    .home-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 2rem;
    }
    
    .home-container h1 {
        color: #333;
        margin-bottom: 0.5rem;
    }
    
    .quick-actions {
        margin-top: 3rem;
        padding: 2rem;
        background-color: #f8f9fa;
        border-radius: 8px;
    }
    
    .quick-actions h3 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: #495057;
    }
    
    .action-buttons {
        display: flex;
        gap: 1rem;
    }
    
    .btn {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        text-align: center;
        transition: background-color 0.2s;
    }
    
    .btn-primary {
        background-color: #007bff;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #0056b3;
    }
</style>
