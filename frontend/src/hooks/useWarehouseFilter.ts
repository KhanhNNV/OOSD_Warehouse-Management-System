import { useState, useMemo } from 'react';
import { LocationData } from '../types/wms';

export const useWarehouseFilter = (data: LocationData[]) => {
  const [searchText, setSearchText] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterShelf, setFilterShelf] = useState('');

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Logic tìm kiếm: Tìm trong Mã đầy đủ (code), Zone, Shelf hoặc Cell
      // Giúp người dùng gõ "01" vẫn tìm ra A-S01-01
      const lowerSearch = searchText.toLowerCase();
      const matchesSearch = 
        item.code.toLowerCase().includes(lowerSearch) || 
        item.shelf.toLowerCase().includes(lowerSearch) ||
        item.cell.toLowerCase().includes(lowerSearch);

      // 2. Logic lọc Zone (Exact match)
      const matchesZone = filterZone ? item.zone === filterZone : true;

      // 3. Logic lọc Shelf (Exact match)
      const matchesShelf = filterShelf ? item.shelf === filterShelf : true;

      return matchesSearch && matchesZone && matchesShelf;
    });
  }, [data, searchText, filterZone, filterShelf]);

  return {
    searchText,
    setSearchText,
    filterZone,
    setFilterZone,
    filterShelf,
    setFilterShelf,
    filteredData,
  };
};