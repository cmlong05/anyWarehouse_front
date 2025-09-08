<div class="home-container">
    <h1>AnyWarehouse 仓库管理系统</h1>
    <p>欢迎使用仓库管理系统</p>
    
    <div class="quick-actions">
        <h3>快速操作</h3>
        <div class="action-buttons">
            <a href="/container/add" class="btn btn-primary">
                添加根容器
            </a>
            <a href="/category/add" class="btn btn-primary">
                添加根分类
            </a>
            <a href="/item/add" class="btn btn-primary">
                添加商品
            </a>
        </div>
    </div>

    <div class="navigation-section">
        <h3>导航</h3>
        <div class="nav-links">
            <a href="/item" class="nav-link">
                <h4>商品管理</h4>
                <p>查看和管理所有商品信息</p>
            </a>
            <a href="/category" class="nav-link">
                <h4>分类管理</h4>
                <p>管理商品分类体系</p>
            </a>
            <a href="/container" class="nav-link">
                <h4>容器管理</h4>
                <p>管理存储容器结构</p>
            </a>
            <a href="/storage" class="nav-link">
                <h4>库存管理</h4>
                <p>查看和管理库存信息</p>
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

    .navigation-section {
        margin-top: 3rem;
        padding: 2rem;
        background-color: #fff;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }

    .navigation-section h3 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: #495057;
    }

    .nav-links {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .nav-link {
        display: block;
        padding: 1.5rem;
        text-decoration: none;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        transition: all 0.2s ease-in-out;
    }

    .nav-link:hover {
        background-color: #e9ecef;
        border-color: #007bff;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .nav-link h4 {
        margin: 0 0 0.5rem 0;
        color: #007bff;
        font-size: 1.1rem;
    }

    .nav-link p {
        margin: 0;
        color: #6c757d;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    @media (max-width: 768px) {
        .action-buttons {
            flex-direction: column;
        }

        .nav-links {
            grid-template-columns: 1fr;
        }
    }
</style>
