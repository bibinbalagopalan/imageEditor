document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('image-input');
    const previewImage = document.getElementById('preview-image');
    const uploadForm = document.getElementById('upload-form');
    let originalImage = null;
    let cropStartX, cropStartY, cropEndX, cropEndY;
    let isCropping = false;
    let imageHistory = [];
    let currentImageIndex = -1;
    // Initialize preview container and crop overlay
    const previewContainer = document.querySelector('.image-preview');
    previewContainer.style.position = 'relative';
    previewContainer.style.overflow = 'hidden';
    
    let cropOverlay = document.createElement('div');
    cropOverlay.style.position = 'absolute';
    cropOverlay.style.border = '2px dashed #fff';
    cropOverlay.style.display = 'none';
    cropOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    previewContainer.appendChild(cropOverlay);

    let confirmCropBtn = document.createElement('button');
    confirmCropBtn.textContent = 'Confirm Crop';
    confirmCropBtn.style.position = 'absolute';
    confirmCropBtn.style.display = 'none';
    confirmCropBtn.style.padding = '8px 16px';
    confirmCropBtn.style.backgroundColor = '#007bff';
    confirmCropBtn.style.color = '#fff';
    confirmCropBtn.style.border = 'none';
    confirmCropBtn.style.borderRadius = '4px';
    confirmCropBtn.style.cursor = 'pointer';
    confirmCropBtn.style.zIndex = '1000';
    previewContainer.appendChild(confirmCropBtn);

    confirmCropBtn.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#0056b3';
    });
    confirmCropBtn.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#007bff';
    });
    confirmCropBtn.addEventListener('click', applyCrop);

    // Handle image upload
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                return;
            }
            // Reset image styles before loading new image
            previewImage.style.display = 'block';
            previewImage.style.visibility = 'visible';
            previewImage.style.opacity = '1';
            
            const reader = new FileReader();
            reader.onload = function(event) {
                originalImage = event.target.result;
                previewImage.src = originalImage;
                // Initialize history with original image
                imageHistory = [originalImage];
                currentImageIndex = 0;
                
                // Create a temporary image to ensure proper loading
                const tempImg = new Image();
                tempImg.onload = function() {
                    // Update preview image dimensions
                    const maxWidth = previewImage.parentElement.clientWidth;
                    const maxHeight = previewImage.parentElement.clientHeight;
                    const aspectRatio = tempImg.width / tempImg.height;
                    
                    if (tempImg.width > maxWidth || tempImg.height > maxHeight) {
                        if (maxWidth / maxHeight > aspectRatio) {
                            previewImage.style.height = maxHeight + 'px';
                            previewImage.style.width = 'auto';
                        } else {
                            previewImage.style.width = maxWidth + 'px';
                            previewImage.style.height = 'auto';
                        }
                    } else {
                        previewImage.style.width = tempImg.width + 'px';
                        previewImage.style.height = tempImg.height + 'px';
                    }
                };
                tempImg.src = event.target.result;
            };
            reader.onerror = function() {
                alert('Error reading file. Please try again.');
            };
            reader.readAsDataURL(file);
        }
    });

    // Basic image adjustments
    document.getElementById('rotate-left').addEventListener('click', () => rotateImage(-90));
    document.getElementById('rotate-right').addEventListener('click', () => rotateImage(90));
    document.getElementById('flip-horizontal').addEventListener('click', () => flipImage('horizontal'));
    document.getElementById('flip-vertical').addEventListener('click', () => flipImage('vertical'));

    // Filter effects with sliders
    const brightnessSlider = document.getElementById('brightness-slider');
    const contrastSlider = document.getElementById('contrast-slider');
    const grayscaleSlider = document.getElementById('grayscale-slider');
    const blurSlider = document.getElementById('blur-slider');

    // Add event listeners for sliders
    brightnessSlider.addEventListener('input', () => applyFilter('brightness', brightnessSlider.value, false));
    contrastSlider.addEventListener('input', () => applyFilter('contrast', contrastSlider.value, false));
    grayscaleSlider.addEventListener('input', () => applyFilter('grayscale', grayscaleSlider.value, false));
    blurSlider.addEventListener('input', () => applyFilter('blur', blurSlider.value, false));

    // Save history when slider adjustment ends
    brightnessSlider.addEventListener('change', () => applyFilter('brightness', brightnessSlider.value, true));
    contrastSlider.addEventListener('change', () => applyFilter('contrast', contrastSlider.value, true));
    grayscaleSlider.addEventListener('change', () => applyFilter('grayscale', grayscaleSlider.value, true));
    blurSlider.addEventListener('change', () => applyFilter('blur', blurSlider.value, true));

    // Add event listeners for buttons
    document.getElementById('brightness').addEventListener('click', () => brightnessSlider.value = 100);
    document.getElementById('contrast').addEventListener('click', () => contrastSlider.value = 100);
    document.getElementById('grayscale').addEventListener('click', () => grayscaleSlider.value = 0);
    document.getElementById('blur').addEventListener('click', () => {
        blurSlider.value = 0;
        applyFilter('blur', blurSlider.value, true);
    });

    // Action buttons
    document.getElementById('reset').addEventListener('click', resetImage);
    document.getElementById('save').addEventListener('click', saveImage);
    document.getElementById('crop').addEventListener('click', initCrop);
    document.getElementById('undo').addEventListener('click', undoLastAction);

    function saveToHistory(imageData) {
        // Remove any redo states
        imageHistory = imageHistory.slice(0, currentImageIndex + 1);
        imageHistory.push(imageData);
        currentImageIndex++;
    }

    function undoLastAction() {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            previewImage.src = imageHistory[currentImageIndex];
        }
    }

    // Crop functionality
    function initCrop() {
        isCropping = true;
        previewImage.style.cursor = 'crosshair';
        cropOverlay.style.display = 'block';
        
        previewImage.addEventListener('mousedown', startCrop);
        previewImage.addEventListener('mousemove', updateCrop);
        previewImage.addEventListener('mouseup', endCrop);
    }

    function startCrop(e) {
        if (!isCropping) return;
        const rect = previewImage.getBoundingClientRect();
        cropStartX = e.clientX - rect.left;
        cropStartY = e.clientY - rect.top;
        cropOverlay.style.left = cropStartX + 'px';
        cropOverlay.style.top = cropStartY + 'px';
        cropOverlay.style.width = '0px';
        cropOverlay.style.height = '0px';
    }

    function updateCrop(e) {
        if (!isCropping || e.buttons !== 1) return;
        const rect = previewImage.getBoundingClientRect();
        cropEndX = e.clientX - rect.left;
        cropEndY = e.clientY - rect.top;

        const width = Math.abs(cropEndX - cropStartX);
        const height = Math.abs(cropEndY - cropStartY);
        const left = Math.min(cropStartX, cropEndX);
        const top = Math.min(cropStartY, cropEndY);

        cropOverlay.style.left = left + 'px';
        cropOverlay.style.top = top + 'px';
        cropOverlay.style.width = width + 'px';
        cropOverlay.style.height = height + 'px';
    }

    function endCrop() {
        if (!isCropping || !cropStartX || !cropEndX) return;
        const width = Math.abs(cropEndX - cropStartX);
        const height = Math.abs(cropEndY - cropStartY);
        if (width < 10 || height < 10) {
            resetCropState();
            return;
        }
        
        // Position the confirm button near the crop overlay
        const left = Math.min(cropStartX, cropEndX);
        const top = Math.min(cropStartY, cropEndY);
        confirmCropBtn.style.display = 'block';
        confirmCropBtn.style.left = (left + width + 10) + 'px';
        confirmCropBtn.style.top = top + 'px';

        previewImage.removeEventListener('mousemove', updateCrop);
    }

    function applyCrop() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
            const scaleX = img.width / previewImage.width;
            const scaleY = img.height / previewImage.height;

            const cropWidth = Math.abs(cropEndX - cropStartX) * scaleX;
            const cropHeight = Math.abs(cropEndY - cropStartY) * scaleY;
            const cropLeft = Math.min(cropStartX, cropEndX) * scaleX;
            const cropTop = Math.min(cropStartY, cropEndY) * scaleY;

            canvas.width = cropWidth;
            canvas.height = cropHeight;
            ctx.drawImage(img, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            const newImageData = canvas.toDataURL();
            previewImage.src = newImageData;
            saveToHistory(newImageData);
            resetCropState();
        };
        img.src = previewImage.src;
    }

    function resetCropState() {
        isCropping = false;
        previewImage.style.cursor = 'default';
        cropOverlay.style.display = 'none';
        confirmCropBtn.style.display = 'none';
        cropStartX = cropStartY = cropEndX = cropEndY = null;
        
        previewImage.removeEventListener('mousedown', startCrop);
        previewImage.removeEventListener('mousemove', updateCrop);
        previewImage.removeEventListener('mouseup', endCrop);
    }

    // Image manipulation functions
    function rotateImage(degrees) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.height;
            canvas.height = img.width;
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.rotate(degrees * Math.PI/180);
            ctx.drawImage(img, -img.width/2, -img.height/2);
            const newImageData = canvas.toDataURL();
            previewImage.src = newImageData;
            saveToHistory(newImageData);
        };
        img.src = previewImage.src;
    }

    function flipImage(direction) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            if (direction === 'horizontal') {
                ctx.scale(-1, 1);
                ctx.translate(-canvas.width, 0);
            } else {
                ctx.scale(1, -1);
                ctx.translate(0, -canvas.height);
            }
            ctx.drawImage(img, 0, 0);
            const newImageData = canvas.toDataURL();
            previewImage.src = newImageData;
            saveToHistory(newImageData);
        };
        img.src = previewImage.src;
    }

    function applyFilter(filterType, value, saveHistory = true) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Get current filter values
            const brightness = brightnessSlider.value;
            const contrast = contrastSlider.value;
            const grayscale = grayscaleSlider.value;
            const blur = blurSlider.value;
            
            // Build filter string based on current values
            let filters = [];
            if (brightness !== '100') filters.push(`brightness(${brightness}%)`);
            if (contrast !== '100') filters.push(`contrast(${contrast}%)`);
            if (grayscale !== '0') filters.push(`grayscale(${grayscale}%)`);
            if (Number(blur) > 0) filters.push(`blur(${blur}px)`);
            
            // Apply all filters
            ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
            ctx.drawImage(img, 0, 0);
            const newImageData = canvas.toDataURL();
            previewImage.src = newImageData;
            if (saveHistory) {
                saveToHistory(newImageData);
            }
        };
        img.src = imageHistory[currentImageIndex];
    }

    function getFilterString(filterType, value) {
        const filters = {
            brightness: `brightness(${value}%)`,
            contrast: `contrast(${value}%)`,
            grayscale: `grayscale(${value}%)`,
            blur: `blur(${value}px)`
        };
        return filters[filterType];
    }

    function resetImage() {
        if (originalImage) {
            // Reset all sliders to their default values
            brightnessSlider.value = 100;
            contrastSlider.value = 100;
            grayscaleSlider.value = 0;
            blurSlider.value = 0;
            
            // Reset the image to original
            previewImage.src = originalImage;
            // Update history
            imageHistory = [originalImage];
            currentImageIndex = 0;
            
            // Clear all filters
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.filter = 'none';
                ctx.drawImage(img, 0, 0);
                const newImageData = canvas.toDataURL();
                previewImage.src = newImageData;
                saveToHistory(newImageData);
            };
            img.src = originalImage;
        }
    }

    function saveImage() {
        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = previewImage.src;
        link.click();
    }
});