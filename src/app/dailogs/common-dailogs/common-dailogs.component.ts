import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SatelliteService } from '../../services/satellite.service';
import { LabelType, NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { UtcDateTimePipe } from '../../pipes/date-format.pipe';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import dayjs from 'dayjs';

@Component({
  selector: 'app-common-dailogs',
  standalone: true,
  imports: [CommonModule,FormsModule,MatFormFieldModule,ReactiveFormsModule,MatInputModule,MatSelectModule,
      MatSliderModule,MatCheckboxModule,
      MatMenuModule,
      MatTableModule,UtcDateTimePipe,
      NgxSliderModule,],
  templateUrl: './common-dailogs.component.html',
  styleUrl: './common-dailogs.component.scss'
})
export class CommonDailogsComponent implements OnInit,AfterViewInit  {
  name: string = '';
vendorsList:any[]=['airbus','blacksky','capella','maxar','planet','skyfi-umbra'];
dayOfWeeks:any[]=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  typesList:any[]=['morning','midday','evening','overnight', 'unknown'];
  formGroup: FormGroup;
  // Default values for manual filters
  defaultMinCloud = -10;
  defaultMaxCloud = 60;
  defaultMinAngle = 0;
  defaultMaxAngle = 55;
  defaultMinGsd = 0;
  defaultMaxGsd = 4;
  defaultMinAzimuthAngle = 0;
  defaultMaxAzimuthAngle = 365;
  defaultMinholdbackSecond = 0;
  defaultMaxHoldbackSecond = 36;
  defaultMinIlluminationAzimuthAngle = 0;
  defaultMaxIlluminationAzimuthAngle = 370;
  defaultMinIlluminationElevationAngle = 0;
  defaultMaxIlluminationElevationAngle = 370;
  max_cloud:number = this.defaultMaxCloud
  min_cloud: number = this.defaultMinCloud;
  defaultIsPurchased = false
  options: Options = {
    step: 10,
    showTicks: true,
    floor: -10,
    ceil: 60,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 60) {
        return '50+';
      } else if (value == -10 && LabelType.Low == label) {                
        return 'SAR';
      }else if (value == -10) {                
        return '';
      }
      return `${value}%`; // Default for other values
    },
  };
  max_angle:number = this.defaultMaxAngle;
  min_angle: number = this.defaultMinAngle;
  min_azimuth_angle:number = this.defaultMinAzimuthAngle;
  max_azimuth_angle:number = this.defaultMaxAzimuthAngle;
  min_holdback_seconds:number = this.defaultMinholdbackSecond;
  max_holdback_seconds:number = this.defaultMaxHoldbackSecond;
  min_illumination_azimuth_angle:number = this.defaultMinIlluminationAzimuthAngle;
  max_illumination_azimuth_angle:number = this.defaultMaxIlluminationAzimuthAngle;
  min_illumination_elevation_angle:number = this.defaultMinIlluminationElevationAngle;
  max_illumination_elevation_angle:number = this.defaultMaxIlluminationElevationAngle;
  isPurchased = this.defaultIsPurchased
  angleOptions: Options = {
    step: 5,
    showTicks: true,
    floor: 0,
    ceil: 55,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 55) {
        return '50+';
      }
      return `${value}°`; // Default for other values
    },
  };
  azimuthOptions: Options = {
    step: 10,
    showTicks: true,
    floor: 0,
    ceil: 365,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 365) {
        return '360+';
      }
      return `${value}°`; // Default for other values
    },
  };
  holdbackOptions: Options = {
    step: 1,
    showTicks: true,
    floor: 0,
    ceil: 36,
    translate: (value: number, label: LabelType): string => {
    if (value === 36) {
        return '35+';
      }
      return `${value}`; // Default for other values
    },
  };
  illuminationAzimuthOptions: Options = {
    step: 10,
    showTicks: true,
    floor: 0,
    ceil: 370,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 370) {
        return '360+';
      }
      return `${value}°`; // Default for other values
    },
  };
  illuminationElevationOptions: Options = {
    step: 10,
    showTicks: true,
    floor: 0,
    ceil: 370,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 370) {
        return '360+';
      }
      return `${value}°`; // Default for other values
    },
  };
  min_gsd:number =this.defaultMinGsd;
  max_gsd:number =this.defaultMaxGsd;
  gsd_options: Options = {
    step: 0.1,
    showTicks: true,
    floor: 0,
    ceil:4,
    translate: (value: number, label: LabelType): string => {
      if (value === 0) {
        return '0';
      } else if (value === 4) {
        return '3+';
      }
      return `${value}m`; // Default for other values
    },
    
  };
  @ViewChildren('sliderElement') sliderElements!: QueryList<ElementRef>;
  @ViewChild("menuFilterTrigger") menuFilterTrigger!: MatMenuTrigger;
  @ViewChild("scrollableDiv") scrollableDiv!: ElementRef<HTMLDivElement>;
  sliderShow:boolean = false;
  viewLogsData=new MatTableDataSource<any>(/* your data source */);
  filterParams:any;
  filerCount:number = 0
  innerDisplayedColumns = ['db_id','vendor_id','failure_reason', 'process_time'];
   vendor = new FormControl([]);
   exclude_text:FormControl<string> = new FormControl('');
   search_text:FormControl<string> = new FormControl('');
   page_number= 1
    page_size= 50
    originalData: any[] = [];
    private canTriggerAction = true;
    private isAtBottom = false;
    totalPages:any
  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
   private satelliteService:SatelliteService,
   private fb: FormBuilder,
   private renderer: Renderer2,
   private el: ElementRef,
   private overlayContainer: OverlayContainer,
   public dialogRef: MatDialogRef<CommonDailogsComponent>
  ){
    this.formGroup = this.fb.group({
      vendor:[],
      type: [],
      day_of_week:[],
      vendorId:null,
      
    });
  }

  ngOnInit(): void {
    if(this.data.type === 'rename'){
      this.name = this.data?.group?.name || this.data?.site?.name
    }
    if(this.data.type ==='filters'){
      this.min_cloud = this.data?.filterParams?.min_cloud_cover !== undefined
  ? this.data.filterParams.min_cloud_cover === -1 
    ? -10 
    : this.data.filterParams.min_cloud_cover
  : this.defaultMinCloud;
      this.max_cloud = this.data?.filterParams?.max_cloud_cover? this.data?.filterParams?.max_cloud_cover: this.defaultMaxCloud,
      this.min_angle = this.data?.filterParams?.min_off_nadir_angle? this.data?.filterParams?.min_off_nadir_angle: this.defaultMinAngle,
      this.max_angle = this.data?.filterParams?.max_off_nadir_angle? this.data?.filterParams?.max_off_nadir_angle: this.defaultMaxAngle,
      this.min_gsd = this.data?.filterParams?.min_gsd? this.data?.filterParams?.min_gsd: this.defaultMinGsd,
      this.max_gsd = this.data?.filterParams?.max_gsd? this.data?.filterParams?.max_gsd: this.defaultMaxGsd,
      this.min_azimuth_angle = this.data?.filterParams?.min_azimuth_angle? this.data?.filterParams?.min_azimuth_angle: this.defaultMinAzimuthAngle,
      this.max_azimuth_angle = this.data?.filterParams?.max_azimuth_angle? this.data?.filterParams?.max_azimuth_angle: this.defaultMaxAzimuthAngle,
      this.min_holdback_seconds = this.data?.filterParams?.min_holdback_seconds? this.data?.filterParams?.min_holdback_seconds: this.defaultMinholdbackSecond,
      this.max_holdback_seconds = this.data?.filterParams?.max_holdback_seconds? this.data?.filterParams?.max_holdback_seconds: this.defaultMaxHoldbackSecond,
      this.min_illumination_azimuth_angle = this.data?.filterParams?.min_illumination_azimuth_angle? this.data?.filterParams?.min_illumination_azimuth_angle: this.defaultMinIlluminationAzimuthAngle,
      this.max_illumination_azimuth_angle = this.data?.filterParams?.max_illumination_azimuth_angle? this.data?.filterParams?.max_illumination_azimuth_angle: this.defaultMaxIlluminationAzimuthAngle,
      this.min_illumination_elevation_angle = this.data?.filterParams?.min_illumination_elevation_angle? this.data?.filterParams?.min_illumination_elevation_angle: this.defaultMinIlluminationElevationAngle,
      this.max_illumination_elevation_angle = this.data?.filterParams?.max_illumination_elevation_angle? this.data?.filterParams?.max_illumination_elevation_angle: this.defaultMaxIlluminationElevationAngle
      this.formGroup.patchValue({
        vendor: this.data?.filterParams?.vendor_name 
          ? this.data?.filterParams?.vendor_name.split(',') 
          : [],
          day_of_week:this.data?.filterParams?.day_of_week 
          ? this.data?.filterParams?.day_of_week.split(',') 
          : [],
      
        vendorId: this.data?.filterParams?.vendor_id 
          ? this.data?.filterParams?.vendor_id 
          : [],
      
        type: this.data?.filterParams?.user_duration_type 
          ? this.data?.filterParams?.user_duration_type.split(',') 
          : []
      });
      this.isPurchased = this.data?.filterParams?.is_purchased ? this.data?.filterParams?.is_purchased: this.defaultIsPurchased
      setTimeout(()=>{
        this.sliderShow = true;
        // Apply styles to each slider element
        const sliders = document.querySelectorAll('.ngx-slider');
      sliders.forEach((slider) => {
        this.renderer.setStyle(slider, 'width', '100%');
      });
      
      },300)
    }

    if(this.data.type === 'logs'){
      let queryParams
      if(this.data.status ==='parent'){
        const inputDate = dayjs.utc(this.data.data.date);

        // Start of the given day
        const startDate = inputDate.startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');

        // End of the given day
        const endDate = inputDate.endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');
        queryParams = {
          start_date:startDate,
          end_date:endDate,
          page_number:this.page_number,
          page_size:this.page_size
        }
      } else {
        queryParams = {
          pipeline_history_id:this.data.data.id,
          page_number:this.page_number,
          page_size:this.page_size
        }
      }
      this.filterParams = queryParams
      console.log(this.data,'datadatadatadatadatadatadatadatadata');
      this.getPipeLineData(queryParams)
      
    }
    
  }

  ngAfterViewInit(): void {
    if (this.viewLogsData && this.data.type === 'logs') {
      setTimeout(() => {
        console.log('lllllllll');
    
        this.setDynamicHeight();
        window.addEventListener("resize", this.setDynamicHeight.bind(this));
        
        const div = this.scrollableDiv?.nativeElement;
    
        if (div) {
          div.addEventListener("wheel", this.handleWheelEvent);
        } else {
          console.warn("scrollableDiv is undefined");
        }
    
      }, 300);
    }
    
    // this.dataSource.sort = this.sort;
    
  }
  addGroup(){
    if(this.name !==''){
    let payload
    if(this.data.type === 'addSubgroup'){
      payload = {
        name: this.name,
        parent:this.data.parent,
        notification:false,
      }
    } else {
      payload = {
        name: this.name,
        notification:false,
      }
    }
     
    this.satelliteService.addGroup(payload).subscribe({
      next: (resp) => {
        this.dialogRef.close(resp)

      }
    })
  }
  }

  renameGroup(){
    if(this.name !==''){
      let payload
      if(this.data?.group?.id){
         payload = {
          group_id: this.data.group.id,
          name: this.name,
        }
      } else {
        payload = {
          site_id: this.data?.site?.id,
          name: this.name,
        }
      }
    
    this.updateGroup(payload)
  }
  }

  deleteGroup(){
    let payload
      if(this.data?.group?.id){
         payload = {
          group_id: this.data.group.id,
        }
        this.satelliteService.removeGroup(payload).subscribe({
          next: (resp)=>{
            this.dialogRef.close(resp);
            
          },
          error: (err)=>{

          }
        })
      } else {
        payload = {
          site_id: this.data?.site?.id,
          name: this.data?.site?.name,
          is_deleted: true,
        }
        this.updateGroup(payload)
      }
   
  }

  updateGroup(payload: any) {
    if(this.data?.group?.id){
      this.satelliteService.updateGroup(payload).subscribe({
        next: (resp) =>{
          this.dialogRef.close({resp:resp,parentGroupID:this.data.parentGroupID})
        },
        error(err) {
          
        },
      })
    } else {
      this.satelliteService.updateSite(payload).subscribe({
        next: (resp) => {
          if (resp) {
            this.dialogRef.close({resp:resp})
          }
  
  
        }
      })
    }
    
  }

  onSubmit(): void {
    let filterCount = 0; // Counter for applied filters
    let queryParams:any={}
    let minCloud
    if(this.min_cloud <= -1) {
      minCloud = -1
    } else {
      minCloud = this.min_cloud
    } 
      // Default values
      const defaultValues = {
        minCloud: this.data?.filterParams?.minCloud !== undefined
        ? this.data.filterParams.minCloud
        : this.defaultMinCloud <= -1 
          ? -1 
          : this.defaultMinCloud,      
        maxCloud:this.data?.filterParams?.maxCloud? this.data?.filterParams?.maxCloud: this.defaultMaxCloud,
        minAngle:this.data?.filterParams?.minAngle? this.data?.filterParams?.minAngle: this.defaultMinAngle,
        maxAngle:this.data?.filterParams?.maxAngle? this.data?.filterParams?.maxAngle: this.defaultMaxAngle,
        minGsd:this.data?.filterParams?.minGsd? this.data?.filterParams?.minGsd: this.defaultMinGsd,
        maxGsd:this.data?.filterParams?.maxGsd? this.data?.filterParams?.maxGsd: this.defaultMaxGsd,
        minAzimuthAngle:this.data?.filterParams?.minAzimuthAngle? this.data?.filterParams?.minAzimuthAngle: this.defaultMinAzimuthAngle,
        maxAzimuthAngle:this.data?.filterParams?.maxAzimuthAngle? this.data?.filterParams?.maxAzimuthAngle: this.defaultMaxAzimuthAngle,
        minHoldbackSeconds:this.data?.filterParams?.minHoldbackSeconds? this.data?.filterParams?.minHoldbackSeconds: this.defaultMinholdbackSecond,
        maxHoldbackSeconds:this.data?.filterParams?.maxHoldbackSeconds? this.data?.filterParams?.maxHoldbackSeconds: this.defaultMaxHoldbackSecond,
        minIlluminationAzimuthAngle:this.data?.filterParams?.minIlluminationAzimuthAngle? this.data?.filterParams?.minIlluminationAzimuthAngle: this.defaultMinIlluminationAzimuthAngle,
        maxIlluminationAzimuthAngle:this.data?.filterParams?.maxIlluminationAzimuthAngle? this.data?.filterParams?.maxIlluminationAzimuthAngle: this.defaultMaxIlluminationAzimuthAngle,
        minIlluminationElevationAngle:this.data?.filterParams?.minIlluminationElevationAngle? this.data?.filterParams?.minIlluminationElevationAngle: this.defaultMinIlluminationElevationAngle,
        maxIlluminationElevationAngle:this.data?.filterParams?.maxIlluminationElevationAngle? this.data?.filterParams?.maxIlluminationElevationAngle: this.defaultMaxIlluminationElevationAngle,
        is_purchased: this.isPurchased ? this.isPurchased: this.data?.filterParams?.is_purchased
      };
    
      // Function to add a filter and increment counter
      const addFilter = (key: string, value: any, defaultValue: any) => {
        if (value !== defaultValue) {
          queryParams[key] = value;
          return true;
        }
        return false;
      };
      
      const addMinMaxFilter = (
        minKey: string,
        minValue: any,
        minDefault: any,
        maxKey: string,
        maxValue: any,
        maxDefault: any
      ) => {
        const minChanged = minValue !== minDefault;
        const maxChanged = maxValue !== maxDefault;

        if (minChanged || maxChanged) {
          queryParams[minKey] = minValue;
          queryParams[maxKey] = maxValue;
          filterCount++;
        }
      };

      // Apply filters ensuring both min and max are included if either changes
      addMinMaxFilter(
        "min_cloud_cover",
        minCloud,
        defaultValues.minCloud,
        "max_cloud_cover",
        this.max_cloud,
        defaultValues.maxCloud
      );

      addMinMaxFilter(
        "min_off_nadir_angle",
        this.min_angle,
        defaultValues.minAngle,
        "max_off_nadir_angle",
        this.max_angle,
        defaultValues.maxAngle
      );

      addMinMaxFilter(
        "min_gsd",
        this.min_gsd,
        defaultValues.minGsd,
        "max_gsd",
        this.max_gsd,
        defaultValues.maxGsd
      );

      addMinMaxFilter(
        "min_azimuth_angle",
        this.min_azimuth_angle,
        defaultValues.minAzimuthAngle,
        "max_azimuth_angle",
        this.max_azimuth_angle,
        defaultValues.maxAzimuthAngle
      );

      addMinMaxFilter(
        "min_holdback_seconds",
        this.min_holdback_seconds,
        defaultValues.minHoldbackSeconds,
        "max_holdback_seconds",
        this.max_holdback_seconds,
        defaultValues.maxHoldbackSeconds
      );

      addMinMaxFilter(
        "min_illumination_azimuth_angle",
        this.min_illumination_azimuth_angle,
        defaultValues.minIlluminationAzimuthAngle,
        "max_illumination_azimuth_angle",
        this.max_illumination_azimuth_angle,
        defaultValues.maxIlluminationAzimuthAngle
      );

      addMinMaxFilter(
        "min_illumination_elevation_angle",
        this.min_illumination_elevation_angle,
        defaultValues.minIlluminationElevationAngle,
        "max_illumination_elevation_angle",
        this.max_illumination_elevation_angle,
        defaultValues.maxIlluminationElevationAngle
      );
      console.log(this.isPurchased,'isPurchasedisPurchasedisPurchased');
      
      let vendorId
      // Get vendor-related values from the form
      if(this.formGroup.get('vendorId')?.value.length!==0 || this.data?.filterParams?.vendor_id){
        vendorId = this.formGroup.get('vendorId')?.value;
      }
      
      const vendorName = this.formGroup.get('vendor')?.value?.join(',');
      const userDurationType = this.formGroup.get('type')?.value?.join(',');
      const dayOfWeek = this.formGroup.get('day_of_week')?.value?.join(',');
      // Add vendor-related filters only if they have values
      if (vendorId && vendorId !== this.data?.filterParams?.vendor_id) {
        queryParams.vendor_id = vendorId;
        filterCount++;
    }

    if(this.isPurchased !== this.data?.filterParams?.is_purchased && this.isPurchased !== this.defaultIsPurchased){
      queryParams.is_purchased = this.isPurchased
      filterCount++;
    } else if (this.isPurchased && this.isPurchased === this.data?.filterParams?.is_purchased){
      queryParams.is_purchased = this.isPurchased
      filterCount ++;
    } else {
      queryParams.is_purchased = this.isPurchased
    }
    
    if (vendorName && vendorName !== this.data?.filterParams?.vendor_name) {
        queryParams.vendor_name = vendorName;
        filterCount++;
    } else if(vendorName && vendorName === this.data?.filterParams?.vendor_name){
      queryParams.vendor_name = vendorName;
      filterCount++;
    }
    if (dayOfWeek && dayOfWeek !== this.data?.filterParams?.day_of_week) {
      queryParams.day_of_week = dayOfWeek;
      filterCount++;
  } else if(dayOfWeek && dayOfWeek === this.data?.filterParams?.day_of_week){
    queryParams.day_of_week = dayOfWeek;
    filterCount++;
  }
    
    if (userDurationType && userDurationType !== this.data?.filterParams?.user_duration_type) {
        queryParams.user_duration_type = userDurationType;
        filterCount++;
    }
    this.dialogRef.close({queryParams:queryParams,filterCount:filterCount})
  }

  closeDialog(){
    this.dialogRef.close()
  }

  setFilterClass() {
    const containerElement = this.overlayContainer.getContainerElement();
    // Remove existing class before adding a new one
    const classesToRemove = [
      "column-menu",
      "library-overlay-container",
      "site-menu",
      "custom-menu-container",
      "group-overlay-container",
      "filter-overlay-container",
      "log-view-menu"
    ];
    containerElement.classList.remove(...classesToRemove);
    containerElement.classList.add("imagery-filter-container");
    containerElement.addEventListener("click", (event: Event) => {
      event.stopPropagation();
    });
  }
  onMenuClose() {
    this.sliderShow = false;
  }

  closeFilterMenu() {

    if (this.menuFilterTrigger) {
      this.menuFilterTrigger.closeMenu();
    }
  }

  getPipeLineData(queryParams){
    this.satelliteService.getPipelineCollection(queryParams).subscribe({
      next: (resp)=> {
        console.log(resp,'resprespresprespresprespresprespresp');
        // this.viewLogsData = resp?.data?.records;
        this.totalPages = resp?.data?.total_pages
        // this.originalData = resp?.data?.records;
        this.viewLogsData.data = resp?.data?.records;
        this.originalData = [...this.viewLogsData.data];
      },
      error:(err)=>{
        console.error(err)
      }
    })
  }
  resetFilter(): void {
    this.filerCount=0
    this.vendor.reset()
    this.exclude_text.setValue('');
    this.search_text.setValue('');
    let queryParams 
    if(this.data.status ==='parent'){
      const inputDate = dayjs.utc(this.data.data.date);

      // Start of the given day
      const startDate = inputDate.startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');

      // End of the given day
      const endDate = inputDate.endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');
      queryParams = {
        start_date:startDate,
        end_date:endDate,
        page_number:this.page_number,
        page_size:this.page_size
      }
    } else {
      queryParams = {
        pipeline_history_id:this.data.data.id,
        page_number:this.page_number,
        page_size:this.page_size
      }
    }
    this.filterParams = queryParams
    this.getPipeLineData(queryParams)
    // this.filterParams  queryParams
    // this.sharedService.imageryFilter.set({filterParams:this.filterParams,filterCount:this.filterCount}, )
    // this.getImageryCollection(queryParams)
  }
 
  onFilterSubmit() {
    const excludeText = this.exclude_text.value?.trim();
    const searchText = this.search_text.value?.trim();
    const vendors = this.vendor?.value?.join(',');
  
    console.log('Form values:', { excludeText, searchText, vendors });
    console.log('Current filterParams:', this.filterParams);
  
    const queryParams: any = { ...this.filterParams };
  
    // Exclude Text
    if (excludeText && excludeText !== this.filterParams?.exclude_text) {
      queryParams.exclude_text = excludeText;
      if (!this.filterParams?.exclude_text) this.filerCount++;
    } else if (!excludeText && this.filterParams?.exclude_text) {
      delete queryParams.exclude_text;
      if (this.filerCount > 0) this.filerCount--;
    }
  
    // Search Text
    if (searchText && searchText !== this.filterParams?.search_text) {
      queryParams.search_text = searchText;
      if (!this.filterParams?.search_text) this.filerCount++;
    } else if (!searchText && this.filterParams?.search_text) {
      delete queryParams.search_text;
      if (this.filerCount > 0) this.filerCount--;
    }
  
    // Vendors
    if (vendors && vendors !== this.filterParams?.vendor_name) {
      queryParams.vendor_name = vendors;
      if (!this.filterParams?.vendor_name) this.filerCount++;
    } else if (!vendors && this.filterParams?.vendor_name) {
      delete queryParams.vendor_name;
      if (this.filerCount > 0) this.filerCount--;
    }
  
    // Only call if there are any changes
    if (JSON.stringify(queryParams) !== JSON.stringify(this.filterParams)) {
      
      const newQueryParams = {
        ...this.filterParams,
        ...queryParams
      }
      this.filterParams = newQueryParams;
      console.log('Updated queryParams:', newQueryParams);
      this.getPipeLineData(newQueryParams);
      this.closeFilterMenu();
    }
  }

  setDynamicHeight(): void {
    // Get the height of the elements above

    // const header = document.getElementById("header");

    // // Calculate the total height of all the above elements
    // const totalHeight = [header].reduce(
    //   (acc, el) => acc + (el ? el.offsetHeight : 0),
    //   0
    // );

    // Get the height of the viewport
    const viewportHeight = window.innerHeight;

    // Calculate the remaining height for the target div
    const remainingHeight = 698  - 140;
    console.log(remainingHeight,'remainingHeightremainingHeightremainingHeight');
    
    // Get the content div and apply the calculated height
    const contentDiv = this.el.nativeElement.querySelector(".content");

    if (contentDiv) {
      this.renderer.setStyle(contentDiv, "height", `${remainingHeight}px`);
    }
  }

  private handleWheelEvent = (event: WheelEvent): void => {
    const div = this.scrollableDiv?.nativeElement;

    console.log(div.clientHeight,'clientHeightclientHeight',div.scrollHeight);
    
    // Detect if at the bottom
    const isAtBottom =
      div.scrollTop + div.clientHeight + 150 >= div.scrollHeight;

    // Only trigger if at the bottom and trying to scroll down
    if (isAtBottom && event.deltaY > 0 && this.canTriggerAction) {
      if (!this.isAtBottom) {
        this.isAtBottom = true; // Lock the event trigger
        let num = this.page_number;
        this.page_number = num + 1;
        
          let queryParams = {
            ...this.filterParams,
            page_number: this.page_number,
            page_size: this.page_size,
          };
          if(this.page_number <=this.totalPages){
          
          this.satelliteService.getPipelineCollection(queryParams).subscribe({
            next: (resp)=> {
              console.log(resp,'resprespresprespresprespresprespresp');
              const data = resp.data.records.map((item, idx) => ({
                ...item,
                index: idx,
              }));
              this.totalPages = resp?.data?.total_pages
              this.viewLogsData.data = this.viewLogsData.data.concat(data);
              this.originalData = [...this.viewLogsData.data];
            },
            error:(err)=>{
              console.error(err)
            }
          })
          console.log(this.viewLogsData?.data?.length,'lengthlengthlengthlength');
        }
        
        setTimeout(() => {
          this.setDynamicHeight();
          window.addEventListener("resize", this.setDynamicHeight.bind(this));
        }, 300);
        // Set debounce flag to false and reset it after 3 seconds
        this.canTriggerAction = false;
        setTimeout(() => {
          this.canTriggerAction = true;
          this.isAtBottom = false; // Reset at bottom flag
        }, 2000); // 3 seconds delay
      }
    }
  };
  
}
