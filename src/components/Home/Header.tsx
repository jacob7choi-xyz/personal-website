import { motion } from "framer-motion";
import { personalInfo } from "@/constants";
import { fadeInUp } from "@/constants/animations";
import GlitchText from "@/components/Global/GlitchText";

const Header = () => {
  return (
    <motion.div
      {...fadeInUp}
      className="mb-16"
    >
      <div className="flex-between gap-4 mb-4">
        <div className="status-online"></div>
        <span className="label text-tech">SYSTEM_ONLINE</span>
      </div>
      
      <h1 className="heading-1 mb-6">
        <GlitchText 
          text="Jacob J. Choi" 
          triggerOnHover={true}
          autoPlay={true}
          delay={1000}
        />
      </h1>
      
      <div className="body-large text-muted mb-8 max-w-2xl">
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
        className="flex-between gap-4"
      >
        <a 
          href={`mailto:${personalInfo.email}`}
          className="link focus-ring"
        >
          {personalInfo.email}
        </a>
        <div className="w-px h-4 bg-gray-600"></div>
        <span className="body-small text-tech">{personalInfo.status}</span>
      </motion.div>
    </motion.div>
  );
};

export default Header;