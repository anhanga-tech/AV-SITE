import sys

file_path = 'components/Header.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Update handleContactClick
search_click = '''  const handleContactClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('toggle-ai-chat'));
      setIsMobileMenuOpen(false);
    } else {
      setIsMobileMenuOpen(false);
    }
  };'''

replace_click = '''  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('toggle-ai-chat', {
        detail: { message: "Olá! Gostaria de falar com um especialista." }
    }));
    setIsMobileMenuOpen(false);
  };'''

# 2. Update Desktop CTA href/target
search_desktop = '''            <a
              href={isHome ? "#" : getWhatsAppLink("Olá! Gostaria de falar com um especialista.")}
              target={isHome ? "_self" : "_blank"}
              rel="noopener noreferrer"
              aria-label="Fale Conosco"
              onClick={handleContactClick}
              className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-500 flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-vibrant ${buttonClass}`}
            >'''

replace_desktop = '''            <a
              href="#"
              aria-label="Fale Conosco"
              onClick={handleContactClick}
              className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-500 flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-vibrant ${buttonClass}`}
            >'''

# 3. Update Mobile CTA href/target
search_mobile = '''          <a
            href={isHome ? "#" : getWhatsAppLink("Olá! Gostaria de falar com um especialista.")}
            target={isHome ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="bg-brand-vibrant text-center text-white px-5 py-3 rounded-lg font-bold mt-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark focus:outline-none flex justify-center items-center gap-2"
            onClick={handleContactClick}
          >'''

replace_mobile = '''          <a
            href="#"
            className="bg-brand-vibrant text-center text-white px-5 py-3 rounded-lg font-bold mt-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark focus:outline-none flex justify-center items-center gap-2"
            onClick={handleContactClick}
          >'''

if search_click in content:
    content = content.replace(search_click, replace_click)
if search_desktop in content:
    content = content.replace(search_desktop, replace_desktop)
if search_mobile in content:
    content = content.replace(search_mobile, replace_mobile)

with open(file_path, 'w') as f:
    f.write(content)
print("Successfully patched Header.tsx")
