import Hero from "@/components/sections/home/Hero";
import Trust from "@/components/sections/home/Trust";

import FeaturedProjects from "@/components/sections/home/FeaturedProjects";
import Services from "@/components/sections/home/Services";
import Testimonials from "@/components/sections/home/Testimonials";
import WhyMarkUI from "@/components/sections/home/WhyMarkUI";
import Contact from "@/components/sections/home/Contact";
import Articles from "./insights/page";

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <Hero />
      <Trust />
      <Services />
      <FeaturedProjects />
      <Testimonials />
      <WhyMarkUI /> 
  
     <Articles/>
      
      
      <Contact />
    </main>
  );
}