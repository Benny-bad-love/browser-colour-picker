chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "requestColorPick") {
    if (window.EyeDropper) {
      const eyeDropper = new EyeDropper();
      eyeDropper.open().then(result => {
        chrome.runtime.sendMessage({ 
          action: "colorPicked", 
          color: result.sRGBHex,
          slotIndex: request.slotIndex
        });
      }).catch(error => {
        console.error("EyeDropper error:", error);
        fallbackColorPicker(request.slotIndex);
      });
    } else {
      console.log("EyeDropper not supported, using fallback method");
      fallbackColorPicker(request.slotIndex);
    }
  }
});

function fallbackColorPicker(slotIndex) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.zIndex = '9999';
  overlay.style.cursor = 'crosshair';

  function handleMouseMove(e) {
    const x = e.clientX;
    const y = e.clientY;
    const element = document.elementFromPoint(x, y);
    if (element) {
      const color = window.getComputedStyle(element).backgroundColor;
      overlay.style.backgroundColor = color;
    }
  }

  function handleClick(e) {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    const element = document.elementFromPoint(x, y);
    if (element) {
      const color = window.getComputedStyle(element).backgroundColor;
      chrome.runtime.sendMessage({ 
        action: "colorPicked", 
        color: color,
        slotIndex: slotIndex
      });
    }
    document.body.removeChild(overlay);
    overlay.removeEventListener('mousemove', handleMouseMove);
    overlay.removeEventListener('click', handleClick);
  }

  overlay.addEventListener('mousemove', handleMouseMove);
  overlay.addEventListener('click', handleClick);
  document.body.appendChild(overlay);
}