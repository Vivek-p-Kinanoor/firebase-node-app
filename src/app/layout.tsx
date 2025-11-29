
"use client";

import { useState, useEffect, useRef } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script'; // Import the Script component
import { usePathname } from 'next/navigation';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';
import {
  Sun, CloudSun, Cloud, Cloudy, CloudFog, CloudDrizzle,
  CloudSnow, CloudHail, CloudLightning, Wind, Snowflake,
  CloudRain, CloudRainWind, Thermometer, Users, ArrowUp, HeartPulse
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatBox } from '@/components/chat/chat-box';
import { cn } from '@/lib/utils';


// Weather Icon Helper
const getWeatherIcon = (code: string) => {
  const iconProps = { className: "h-5 w-5 inline-block ml-2 text-muted-foreground" };
  switch (code) {
    case '113': return <Sun {...iconProps} />;
    case '116': return <CloudSun {...iconProps} />;
    case '119': return <Cloud {...iconProps} />;
    case '122': return <Cloudy {...iconProps} />;
    case '143': case '248': case '260': return <CloudFog {...iconProps} />;
    case '176': case '185': case '263': case '266': case '281': case '284': return <CloudDrizzle {...iconProps} />;
    case '179': case '323': case '326': case '329': case '332': case '335': case '368': case '371': return <CloudSnow {...iconProps} />;
    case '182': case '317': case '320': case '350': case '362': case '365': case '374': case '377': return <CloudHail {...iconProps} />;
    case '200': case '386': case '389': case '392': case '395': return <CloudLightning {...iconProps} />;
    case '227': return <Wind {...iconProps} />;
    case '230': return <Snowflake {...iconProps} />;
    case '293': case '296': case '299': case '302': case '305': case '308': case '311': case '314': return <CloudRain {...iconProps} />;
    case '353': case '356': case '359': return <CloudRainWind {...iconProps} />;
    default: return <Thermometer {...iconProps} />;
  }
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin-panel-sentinel';

  const [bgImage, setBgImage] = useState('/bg3.jpg');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [weatherData, setWeatherData] = useState<{ icon: React.ReactNode; description: string; temp: string; } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
  const isChatOpenRef = useRef(isChatOpen);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsScrollTopVisible(true);
      } else {
        setIsScrollTopVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  useEffect(() => {
    // Date & Time updater
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
      setCurrentTime(now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    // Weather fetcher with geolocation
    const fetchWeather = async (url: string) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn("Weather data not available. Status:", response.status);
                setWeatherData(null);
                return;
            }
            const data = await response.json();
            const currentCondition = data.current_condition[0];
            const weatherCode = currentCondition.weatherCode;
    
            setWeatherData({
              icon: getWeatherIcon(weatherCode),
              description: currentCondition.weatherDesc[0].value,
              temp: `${currentCondition.temp_C}°C / ${currentCondition.temp_F}°F`
            });

        } catch (error) {
            console.warn("Failed to fetch weather:", error);
            setWeatherData(null);
        }
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeather(`https://wttr.in/${latitude},${longitude}?format=j1`);
            },
            () => {
                // User denied permission or an error occurred, fallback to IP-based lookup
                fetchWeather('https://wttr.in/?format=j1');
            }
        );
    } else {
        // Geolocation not supported by the browser, fallback to IP-based
        fetchWeather('https://wttr.in/?format=j1');
    }

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const metadata: Metadata = {
    title: 'Bhasha Guard',
    description: 'Spell checking for Malayalam, English hashtags, and name verification.',
  };

  const handleChatOpenChange = (open: boolean) => {
    setIsChatOpen(open);
    if (open) {
      setHasUnreadMessages(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-6889456719572936" />
        {/* Google Analytics Scripts */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-3MJ55MDBRN"
        />
        <Script id="google-analytics-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3MJ55MDBRN');
          `}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@100..800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@100..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@100..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@100..900&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='10' fill='%2333ccbb' /><text x='50' y='55' font-size='50' font-family='Literata' font-weight='bold' text-anchor='middle' fill='%231f2937'>BG</text></svg>" />
      </head>
      <body style={{ '--bg-image': `url(${bgImage})` } as React.CSSProperties}>
        <TooltipProvider>
          <div id="weather-container">
          </div>
          <Script id="facebook-jssdk-loader" strategy="afterInteractive">
            {`
              window.fbAsyncInit = function() {
                FB.init({
                  appId      : '1419145989231909',
                  xfbml      : true,
                  version    : 'v20.0'
                });
                FB.AppEvents.logPageView();
              };

              (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
              }(document, 'script', 'facebook-jssdk'));
            `}
          </Script>
          <div className="flex flex-col min-h-screen layout-wrapper">
            <header className="py-5 px-4 sm:px-6 lg:px-8 bg-background/70 backdrop-blur-lg sticky top-0 z-50 border-b border-white/20 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="w-1/3 text-left">
                  <span className="text-sm font-mono text-muted-foreground hidden sm:inline">{currentDate}</span>
                </div>
                <div className="w-1/3 text-center">
                  <Link href="/" className="title-glare text-2xl sm:text-4xl font-bold tracking-tight text-foreground hover:text-primary transition-colors duration-300 ease-in-out">
                    Bhasha Guard
                  </Link>
                </div>
                <div className="w-1/3 text-right flex items-center justify-end">
                  <span className="text-sm font-mono text-muted-foreground">{currentTime}</span>
                  {weatherData && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{weatherData.icon}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{weatherData.description}, {weatherData.temp}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </header>
            <main className={cn(
              "flex-grow py-8 px-4 sm:px-6 lg:px-8",
              !isAdminPage && "container mx-auto max-w-7xl"
            )}>
              {children}
            </main>
            <footer className="mt-auto py-8 text-center border-t border-white/20 bg-background/70 backdrop-blur-lg">
              <div className="flex justify-center items-center gap-2 mb-4">
                  <Button variant="link" size="sm" onClick={() => setBgImage('/bg.jpg')}>Light Theme</Button>
                  <Button variant="link" size="sm" onClick={() => setBgImage('/bg3.jpg')}>Dark Theme</Button>
              </div>
              <nav className="flex justify-center items-center space-x-4 sm:space-x-6 mb-4 flex-wrap">
                <Link href="/about-us" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
                <Link href="/feedback" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Feedback
                </Link>
                <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms-and-conditions" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
                <Link href="/version-history" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Version History
                </Link>
                <Link href="/game" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Play Snake
                </Link>
              </nav>

              <div className="my-6">
                <Link href="/support-us" passHref>
                  <Button variant="outline" glow="none" className="h-auto px-6 py-3 font-bold tracking-wider text-base btn-glow-support bg-yellow-400 text-red-600 hover:bg-yellow-500 hover:text-red-700 border-yellow-600">
                    <HeartPulse className="mr-2 h-5 w-5" />
                    Support Our Work
                  </Button>
                </Link>
              </div>
              
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Bhasha Guard. All rights reserved.
              </p>
            </footer>
          </div>
          {isScrollTopVisible && (
            <Button
              onClick={scrollToTop}
              className="fixed bottom-24 left-6 h-12 w-12 rounded-full shadow-lg z-50 transition-opacity hover:opacity-80"
              size="icon"
              glow="none"
            >
              <ArrowUp className="h-6 w-6" />
              <span className="sr-only">Scroll to top</span>
            </Button>
          )}
          <Sheet open={isChatOpen} onOpenChange={handleChatOpenChange}>
            <SheetTrigger asChild>
              <Button
                className={cn(
                  "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
                  hasUnreadMessages && "unread-glow"
                )}
                size="icon"
                glow={hasUnreadMessages ? "none" : "default"}
              >
                <Users className="h-7 w-7" />
                <span className="sr-only">Open Chat</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col" side="right">
              {/* Add a visually hidden title for accessibility */}
              <SheetHeader className="sr-only">
                <SheetTitle>Chat Panel</SheetTitle>
              </SheetHeader>
              <ChatBox setHasUnreadMessages={setHasUnreadMessages} isChatOpen={isChatOpen} />
            </SheetContent>
          </Sheet>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
