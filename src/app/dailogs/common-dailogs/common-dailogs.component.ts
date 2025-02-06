import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SatelliteService } from '../../services/satellite.service';

@Component({
  selector: 'app-common-dailogs',
  standalone: true,
  imports: [CommonModule,FormsModule,MatFormFieldModule,ReactiveFormsModule,MatInputModule],
  templateUrl: './common-dailogs.component.html',
  styleUrl: './common-dailogs.component.scss'
})
export class CommonDailogsComponent implements OnInit  {
  name: string = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
   private satelliteService:SatelliteService,
   public dialogRef: MatDialogRef<CommonDailogsComponent>
  ){}

  ngOnInit(): void {
    if(this.data.type === 'rename'){
      this.name = this.data?.group?.name || this.data?.site?.name
    }
  }
  addGroup(){
    console.log(this.data,'aaaaaaaaaaaaaaaaaaaa');
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
        console.log(resp, 'respresprespresprespresprespresprespresp');
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
          name: this.data?.group?.name,
          is_deleted: true,
        }
      } else {
        payload = {
          site_id: this.data?.site?.id,
          name: this.data?.site?.name,
          is_deleted: true,
        }
      }
    this.updateGroup(payload)
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

  closeDialog(){
    this.dialogRef.close()
  }
}
