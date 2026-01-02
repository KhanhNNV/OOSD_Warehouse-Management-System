package edu.uth.wms.service.impl;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.stream.Collectors;

import edu.uth.wms.dto.request.CategoryRequest;
import edu.uth.wms.dto.response.CategoryResponse;
import edu.uth.wms.repository.ICategoryRepository;
import edu.uth.wms.service.ICategoryService;
import edu.uth.wms.model.Categories;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements ICategoryService {

    final ICategoryRepository categoryRepository;

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest dto) {
        if (categoryRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Tên danh mục đã tồn tại!");
        }

        Categories category = Categories.builder()
                .name(dto.getName())
                .build();

        return toDto(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest dto) {
        Categories category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại!"));
        category.setName(dto.getName());
        return toDto(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    private CategoryResponse toDto(Categories category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .build();
    }

}
