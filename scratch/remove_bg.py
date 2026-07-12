import sys
from PIL import Image, ImageDraw

def main():
    image_path = "/run/media/sourav/New Volume/Projects/pokemon-go-auction-website/public/logo.png"
    output_logo = "/run/media/sourav/New Volume/Projects/pokemon-go-auction-website/public/logo.png"
    output_og = "/run/media/sourav/New Volume/Projects/pokemon-go-auction-website/public/og-logo.png"
    output_icon = "/run/media/sourav/New Volume/Projects/pokemon-go-auction-website/src/app/icon.png"
    
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    # We will use floodfill on a copy of the image to mark the background pixels.
    # We floodfill with a special marker color (0, 255, 0, 255) starting from the four corners.
    temp = img.copy()
    
    # Check average corner color to ensure it is dark
    corners = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    marker_color = (0, 255, 0, 255) # pure green as marker
    
    for cx, cy in corners:
        pixel = temp.getpixel((cx, cy))
        # If it's already green, it's already filled
        if pixel == marker_color:
            continue
        # We fill the background with green, using a tolerance threshold of 35
        # to account for any slight compression artifacts or gradients in the black background.
        ImageDraw.floodfill(temp, (cx, cy), marker_color, thresh=35)
        
    # Replace all green marked pixels with transparency in the original image
    orig_pixels = img.getdata()
    temp_pixels = temp.getdata()
    
    new_pixels = []
    for orig, marked in zip(orig_pixels, temp_pixels):
        if marked == marker_color:
            new_pixels.append((0, 0, 0, 0)) # fully transparent
        else:
            new_pixels.append(orig)
            
    img.putdata(new_pixels)
    
    # Save to all required logo locations
    img.save(output_logo, "PNG")
    img.save(output_og, "PNG")
    img.save(output_icon, "PNG")
    print("Background removed successfully and logos replaced!")

if __name__ == "__main__":
    main()
