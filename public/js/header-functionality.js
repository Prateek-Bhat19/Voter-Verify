document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('overlay');

    if (menuToggle && mobileSidebar && overlay) {
        menuToggle.addEventListener('click', () => {
            mobileSidebar.classList.remove('-translate-x-full');
            overlay.classList.add('opacity-50');
            overlay.classList.remove('pointer-events-none');
        });
    }

    if (sidebarClose && mobileSidebar && overlay) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    if (overlay && mobileSidebar) {
        overlay.addEventListener('click', closeSidebar);
    }

    function closeSidebar() {
        if (mobileSidebar && overlay) {
            mobileSidebar.classList.add('-translate-x-full');
            overlay.classList.remove('opacity-50');
            overlay.classList.add('pointer-events-none');
        }
    }
    
    function redirectTo(page) {
        window.location.href = page;
    }
});
        