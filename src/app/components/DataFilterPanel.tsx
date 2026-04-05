import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Filter, Download, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { toast } from 'sonner';

export type DateFilterType = 'day' | 'week' | 'month' | 'year' | 'custom';

interface DataFilterPanelProps {
  onFilterChange: (filterType: DateFilterType, startDate?: Date, endDate?: Date) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onImportData: (file: File) => void;
}

export const DataFilterPanel: React.FC<DataFilterPanelProps> = ({
  onFilterChange,
  onExportExcel,
  onExportPDF,
  onImportData,
}) => {
  const [filterType, setFilterType] = React.useState<DateFilterType>('day');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFilterChange = (value: DateFilterType) => {
    setFilterType(value);
    if (value !== 'custom') {
      onFilterChange(value);
    }
  };

  const handleCustomFilterApply = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast.error('Start date must be before end date');
      return;
    }

    onFilterChange('custom', start, end);
    toast.success('Custom filter applied');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'text/csv',
      'application/json',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload CSV, JSON, or Excel file');
      return;
    }

    onImportData(file);
    toast.success(`Importing data from ${file.name}...`);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Export Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </h3>
            <div className="flex gap-3">
              <Button
                onClick={onExportExcel}
                variant="outline"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                onClick={onExportPDF}
                variant="outline"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import Historical Data
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV / JSON / Excel
            </Button>
          </div>

          {/* Filter Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Data Filters
            </h3>

            {/* Quick Filters */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-slate-600 dark:text-slate-400">Quick Filters</Label>
                <Select value={filterType} onValueChange={handleFilterChange}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 mt-1">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {filterType === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div>
                    <Label className="text-xs text-slate-600 dark:text-slate-400">From Date</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-600 dark:text-slate-400">To Date</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCustomFilterApply}
                    className="w-full"
                  >
                    Apply Custom Filter
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
