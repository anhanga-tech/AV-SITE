import sys
import re

def cleanup_file(file_path, patterns):
    with open(file_path, 'r') as f:
        content = f.read()
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    with open(file_path, 'w') as f:
        f.write(content)

# Destinations.tsx cleanup
cleanup_file('components/Destinations.tsx', [
    (r'const \[isBookingLoading, setIsBookingLoading\] = useState\(false\);', ''),
    (r'const handleBookingClick = \(e: React\.MouseEvent<HTMLAnchorElement>\) => \{[\s\S]*?\};', '')
])

# Lollapalooza Button.tsx cleanup
cleanup_file('components/landings/lollapalooza/Button.tsx', [
    (r'const whatsappUrl = getWhatsAppLink\(WHATSAPP_MESSAGE\);', '')
])

# Beto Carrero Button.tsx cleanup
cleanup_file('components/landings/beto-carrero/Button.tsx', [
    (r'const whatsappUrl = getWhatsAppLink\(WHATSAPP_MESSAGE\);', '')
])

# OrlandoApp.tsx cleanup
cleanup_file('components/landings/orlando/OrlandoApp.tsx', [
    (r'const whatsappUrl = getWhatsAppLink\(WHATSAPP_MESSAGE\);', '')
])

print("Cleanup complete.")
