package edu.uth.wms.service;

import java.util.List;

import edu.uth.wms.dto.request.CategoryRequest;
import edu.uth.wms.dto.response.CategoryResponse;

public interface ICategoryService {
    List<CategoryResponse> getAllCategories();

    CategoryResponse createCategory(CategoryRequest dto);

    CategoryResponse updateCategory(Long id, CategoryRequest dto);

    void deleteCategory(Long id);

}
