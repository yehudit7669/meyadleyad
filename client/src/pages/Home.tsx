import React from 'react';
// import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import HomeHero from '../components/home/HomeHero';
import CategorySlider from '../components/home/CategorySlider';

const Home: React.FC = () => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  // Filter out "דירות לשבת" category
  const filteredCategories = categories?.filter(
    (cat: any) => cat.nameHe !== 'דירות לשבת'
  ) || [];

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      {/* Hero Section */}
      <HomeHero />

      {/* Category Sliders */}
      <section className="py-12 md:py-16">
        {categoriesLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCategories.length > 0 ? (
          filteredCategories.map((category: any) => (
            <CategorySlider
              key={category.id}
              categoryId={category.id}
              categorySlug={category.slug}
              categoryName={category.nameHe}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            לא נמצאו קטגוריות
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
