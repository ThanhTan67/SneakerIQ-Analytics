package com.example.backend.config;

import com.example.backend.entity.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Seeds ONLY reference data (brands, categories, data sources).
 * Products come from the crawl pipeline, NOT from this seeder.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final DataSourceRepository dataSourceRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (brandRepository.count() > 0) {
            log.info("Reference data already seeded, skipping...");
            return;
        }

        log.info("Seeding reference data (brands, categories, data sources)...");

        Map<String, Brand> brands = createBrands();
        createCategories();
        createDataSources(brands);

        log.info("Reference data seeding complete. Products will be loaded via the crawl pipeline.");
    }

    private Map<String, Brand> createBrands() {
        Map<String, Brand> brands = new LinkedHashMap<>();
        String[][] brandData = {
            {"Nike", "nike", "Thương hiệu giày thể thao hàng đầu thế giới, nổi tiếng với công nghệ Air và đế Zoom."},
            {"Adidas", "adidas", "Thương hiệu Đức nổi tiếng với công nghệ Boost và phong cách thời trang đường phố."},
            {"Puma", "puma", "Thương hiệu giày thể thao kết hợp phong cách thời trang và hiệu suất cao."},
            {"New Balance", "new-balance", "Thương hiệu Mỹ nổi tiếng với chất lượng Made in USA và sự thoải mái tối đa."},
            {"Converse", "converse", "Biểu tượng văn hóa với dòng Chuck Taylor huyền thoại từ năm 1917."},
            {"Vans", "vans", "Thương hiệu skateboard văn hóa đường phố với thiết kế iconic Old Skool."},
            {"Jordan", "jordan", "Dòng giày huyền thoại mang tên Michael Jordan, biểu tượng của bóng rổ và sneaker culture."}
        };

        for (String[] data : brandData) {
            Brand brand = new Brand();
            brand.setName(data[0]);
            brand.setSlug(data[1]);
            brand.setDescription(data[2]);
            brand.setLogo("/images/brands/" + data[1] + ".png");
            brand = brandRepository.save(brand);
            brands.put(data[1], brand);
        }
        return brands;
    }

    private void createCategories() {
        String[] categoryNames = {
            "Running", "Lifestyle", "Basketball", "Skateboarding", "Retro", "Performance"
        };
        for (String name : categoryNames) {
            Category cat = new Category();
            cat.setName(name);
            categoryRepository.save(cat);
        }
    }

    private void createDataSources(Map<String, Brand> brands) {
        String[][] sourceData = {
            {"Nike Official", "OFFICIAL", "https://www.nike.com/vn", "nike"},
            {"Adidas Official", "OFFICIAL", "https://www.adidas.com.vn", "adidas"},
            {"Puma Official", "OFFICIAL", "https://vn.puma.com", "puma"},
            {"New Balance Official", "OFFICIAL", "https://www.newbalance.com", "new-balance"},
            {"Converse Official", "OFFICIAL", "https://www.converse.com.vn", "converse"},
            {"Vans Official", "OFFICIAL", "https://www.vans.com.vn", "vans"},
            {"Jordan Official", "OFFICIAL", "https://www.nike.com/jordan", "jordan"},
            {"TheSneakerDatabase", "CATALOG", "https://thesneakerdatabase.com", null},
            {"Sneaker Market VN", "MARKETPLACE", "https://sneakermarket.vn", null},
            {"Amazon", "MARKETPLACE", "https://www.amazon.com", null},
        };

        for (String[] data : sourceData) {
            DataSource source = new DataSource();
            source.setSourceName(data[0]);
            source.setSourceType(data[1]);
            source.setBaseUrl(data[2]);
            if (data[3] != null) source.setBrand(brands.get(data[3]));
            source.setActive(true);
            source.setTrustScore(
                data[1].equals("OFFICIAL") ? 100 :
                data[1].equals("CATALOG") ? 90 : 80
            );
            dataSourceRepository.save(source);
        }
    }
}
