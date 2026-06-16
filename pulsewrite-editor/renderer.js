const root = document.documentElement;

// Set platform offset
if (window.platform?.isMac) {
  root.style.setProperty('--mac-offset', '72px');
  document.body.classList.add('mac');
} else {
  root.style.setProperty('--mac-offset', '0px');
}

const style = document.createElement('style');
style.textContent = `
  .drag-region {
    -webkit-app-region: drag;
    height: 40px;
    background-color: #222;
    position: fixed;
    top: 0:
    left: 0;
    width: 100%;
  }
  body.mac .top-left-c .logo-for-te {
    display: none !important;
  }
  body.mac .top-left-c button {
    margin-left: 72px !important;
  }
`;
document.head.appendChild(style);

document.body.classList.add('on-app')