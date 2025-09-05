"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { Home, Heart, Sparkles, TrendingUp, Settings, HelpCircle, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

interface MenuItem {
  icon: React.ReactNode
  label: string
  href: string
  gradient: string
  iconColor: string
}

const menuItems: MenuItem[] = [
  {
    icon: <Home className="h-5 w-5" />,
    label: "Dashboard",
    href: "#",
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: <HelpCircle className="h-5 w-5" />,
    label: "How It Works",
    href: "#",
    gradient: "radial-gradient(circle, rgba(255,215,0,0.15) 0%, rgba(255,193,7,0.06) 50%, rgba(255,179,0,0) 100%)",
    iconColor: "text-yellow-500",
  },
  {
    icon: <Settings className="h-5 w-5" />,
    label: "Preferences",
    href: "#",
    gradient: "radial-gradient(circle, rgba(255,20,147,0.15) 0%, rgba(255,20,147,0.06) 50%, rgba(255,20,147,0) 100%)",
    iconColor: "text-pink-500",
  },
  {
    icon: null,
    label: "Unfuck My Past",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(192,192,192,0.15) 0%, rgba(169,169,169,0.06) 50%, rgba(128,128,128,0) 100%)",
    iconColor: "text-gray-400",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    label: "My Results",
    href: "#",
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: <Heart className="h-5 w-5" />,
    label: "My Report",
    href: "#",
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    label: "My Journey",
    href: "#",
    gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
  },
]

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
}

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

export function MenuBar() {
  const { theme, setTheme } = useTheme()

  const isDarkTheme = theme === "dark"

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <motion.nav
      className="p-2 rounded-2xl bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-lg border border-border/40 shadow-lg relative overflow-hidden"
      initial="initial"
      whileHover="hover"
    >
      <motion.div
        className={`absolute -inset-2 bg-gradient-radial from-transparent ${
          isDarkTheme
            ? "via-blue-400/30 via-30% via-purple-400/30 via-60% via-red-400/30 via-90%"
            : "via-blue-400/20 via-30% via-purple-400/20 via-60% via-red-400/20 via-90%"
        } to-transparent rounded-3xl z-0 pointer-events-none`}
        variants={navGlowVariants}
      />
      <ul className="flex items-center gap-2 relative z-10">
        <motion.li className="relative mr-2 ml-4">
          <motion.div
            className="block rounded-xl overflow-visible group relative"
            style={{ perspective: "600px" }}
            whileHover="hover"
            initial="initial"
          >
            <motion.div
              className="flex items-center justify-center p-1"
              variants={itemVariants}
              transition={sharedTransition}
              style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
            >
              <img
                src="/profile-avatar.png"
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover aspect-square"
              />
            </motion.div>
            <motion.div
              className="flex items-center justify-center p-1 absolute inset-0"
              variants={backVariants}
              transition={sharedTransition}
              style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
            >
              <img
                src="/profile-avatar.png"
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover aspect-square"
              />
            </motion.div>
          </motion.div>
        </motion.li>
        {menuItems.map((item, index) => (
          <motion.li key={item.label} className="relative">
            <motion.div
              className="block rounded-xl overflow-visible group relative"
              style={{ perspective: "600px" }}
              whileHover="hover"
              initial="initial"
            >
              <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                variants={glowVariants}
                style={{
                  background: item.gradient,
                  opacity: 0,
                  borderRadius: "16px",
                }}
              />
              <motion.a
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 relative z-10 bg-transparent text-muted-foreground group-hover:text-foreground transition-colors rounded-xl"
                variants={itemVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
              >
                {item.label === "Unfuck My Past" ? (
                  <img src="/unfuck-my-past.png" alt="Unfuck My Past" className="h-10 w-auto" />
                ) : (
                  <>
                    <span className={`transition-colors duration-300 group-hover:${item.iconColor} text-foreground`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </motion.a>
              <motion.a
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 absolute inset-0 z-10 bg-transparent text-muted-foreground group-hover:text-foreground transition-colors rounded-xl"
                variants={backVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
              >
                {item.label === "Unfuck My Past" ? (
                  <img src="/unfuck-my-past.png" alt="Unfuck My Past" className="h-10 w-auto" />
                ) : (
                  <>
                    <span className={`transition-colors duration-300 group-hover:${item.iconColor} text-foreground`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </motion.a>
            </motion.div>
          </motion.li>
        ))}
        <motion.li className="relative ml-2 mr-4">
          <motion.button
            onClick={toggleTheme}
            className="flex items-center justify-center p-3 rounded-xl bg-transparent text-muted-foreground hover:text-foreground transition-all duration-500 relative overflow-hidden"
            style={{ perspective: "600px" }}
            whileHover="hover"
            initial="initial"
          >
            <motion.div
              className="absolute inset-0 z-0 pointer-events-none rounded-xl"
              variants={glowVariants}
              style={{
                background: isDarkTheme
                  ? "radial-gradient(circle, rgba(147,197,253,0.15) 0%, rgba(59,130,246,0.06) 50%, rgba(29,78,216,0) 100%)"
                  : "radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.06) 50%, rgba(217,119,6,0) 100%)",
                opacity: 0,
              }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                opacity: isDarkTheme ? 0 : 1,
                scale: isDarkTheme ? 0.5 : 1,
                rotate: isDarkTheme ? 180 : 0,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Sun className="h-6 w-6 text-yellow-500" />
            </motion.div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                opacity: isDarkTheme ? 1 : 0,
                scale: isDarkTheme ? 1 : 0.5,
                rotate: isDarkTheme ? 0 : -180,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Moon className="h-6 w-6 text-blue-400" />
            </motion.div>
          </motion.button>
        </motion.li>
      </ul>
    </motion.nav>
  )
}
