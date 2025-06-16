import { motion } from "framer-motion";
import { personalInfo } from "@/constants/socials";
import { fadeInUp } from "@/constants/animations";

const Header = () => {
  return (
    <motion.div
      {...fadeInUp}
      className="mb-16"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-green-400 text-sm tracking-wider">SYSTEM_ONLINE</span>
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
        <span className="text-white">Jacob</span>
        <span className="text-cyan-400">.</span>
        <span className="text-white">Choi</span>
      </h1>
      
      <div className="text-xl text-gray-300 mb-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {personalInfo.title}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="flex items-center gap-4"
      >
        <a 
          href={`mailto:${personalInfo.email}`}
          className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 tracking-wide"
        >
          {personalInfo.email}
        </a>
        <div className="w-px h-4 bg-gray-600"></div>
        <span className="text-gray-500 text-sm">{personalInfo.status}</span>
      </motion.div>
    </motion.div>
  );
};

export default Header;